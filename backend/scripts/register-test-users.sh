#!/bin/bash
# Register test users via better-auth API

API_URL="http://localhost:3000"

echo "Registering test users..."

# Register admin
curl -s -X POST "$API_URL/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@phuquoc.jobs",
    "password": "password123",
    "name": "Admin",
    "role": "ADMIN"
  }' && echo " ✓ Admin registered"

# Register employer  
curl -s -X POST "$API_URL/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employer@phuquoc.jobs",
    "password": "password123",
    "name": "Nguyen Van A",
    "role": "EMPLOYER"
  }' && echo " ✓ Employer registered"

# Register candidate
curl -s -X POST "$API_URL/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@phuquoc.jobs",
    "password": "password123",
    "name": "Tran Thi B",
    "role": "CANDIDATE"
  }' && echo " ✓ Candidate registered"

echo "Done! All test accounts created with password: password123"
