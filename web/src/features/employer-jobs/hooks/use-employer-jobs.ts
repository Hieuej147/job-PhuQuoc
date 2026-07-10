"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { archiveEmployerJob, closeEmployerJob, getEmployerJobStats, listEmployerJobs } from "../api";
import { EMPTY_STATS } from "../constants";
import { unwrapJobs } from "../utils";
import type { EmployerJob, JobSort, JobStats, JobStatus } from "../types";

export function useEmployerJobs() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [stats, setStats] = useState<JobStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<JobStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<JobSort>("newest");
  const [closingJob, setClosingJob] = useState<EmployerJob | null>(null);
  const [deletingJob, setDeletingJob] = useState<EmployerJob | null>(null);
  const [rememberCloseConfirm, setRememberCloseConfirm] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsPayload, statsPayload] = await Promise.all([
        listEmployerJobs({ status: filterStatus, sort: sortBy, search: debouncedSearch }),
        getEmployerJobStats(),
      ]);
      setJobs(unwrapJobs(jobsPayload));
      setStats({ ...EMPTY_STATS, ...statsPayload });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh sách tin đăng");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, sortBy]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const closeJob = async (job: EmployerJob) => {
    try {
      await closeEmployerJob(job.id);
      await fetchData();
      toast.success("Đã đóng tin. Tin vẫn được giữ trong dashboard.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đóng tin tuyển dụng");
    }
  };

  const requestCloseJob = async (job: EmployerJob) => {
    if (window.localStorage.getItem("skipConfirm:closeJob") === "true") {
      await closeJob(job);
      return;
    }
    setClosingJob(job);
  };

  const confirmCloseJob = async () => {
    if (!closingJob) return;
    if (rememberCloseConfirm) window.localStorage.setItem("skipConfirm:closeJob", "true");
    await closeJob(closingJob);
    setClosingJob(null);
    setRememberCloseConfirm(false);
  };

  const confirmDeleteJob = async () => {
    if (!deletingJob) return;
    try {
      await archiveEmployerJob(deletingJob.id);
      await fetchData();
      toast.success("Đã xóa tin khỏi danh sách quản lý");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tin khỏi danh sách");
    } finally {
      setDeletingJob(null);
    }
  };

  const totalApplications = useMemo(
    () => jobs.reduce((sum, job) => sum + (job._count?.applications ?? 0), 0),
    [jobs],
  );

  return {
    jobs,
    stats,
    loading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    closingJob,
    setClosingJob,
    deletingJob,
    setDeletingJob,
    rememberCloseConfirm,
    setRememberCloseConfirm,
    requestCloseJob,
    confirmCloseJob,
    confirmDeleteJob,
    totalApplications,
  };
}
