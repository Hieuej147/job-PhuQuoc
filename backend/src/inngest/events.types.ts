export interface ApplicationEventData {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  employerId?: string;
  candidateId?: string;
}

export interface JobEventData {
  jobId: string;
  deadline?: string;
}

export interface UserRegisteredData {
  userId: string;
  email: string;
  name: string;
}

export interface InngestEventMap {
  'application.created': ApplicationEventData;
  'application.accepted': ApplicationEventData;
  'application.rejected': ApplicationEventData;
  'user.registered': UserRegisteredData;
  'job.activated': JobEventData;
  'job.expiring-soon': JobEventData;
  'job.expired': JobEventData;
}

export type EventName = keyof InngestEventMap;
export type EventData<T extends EventName> = InngestEventMap[T];
