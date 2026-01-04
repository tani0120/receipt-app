# Google Cloud Scheduler Setup Script for BFF Worker
# This script creates a Cloud Scheduler job that triggers the BFF worker endpoint with OIDC authentication.

$PROJECT_ID = "gen-lang-client-0837543731"
$LOCATION = "asia-northeast1" # Tokyo
$SERVICE_ACCOUNT_EMAIL = "sugu-suru@gen-lang-client-0837543731.iam.gserviceaccount.com" # e.g. service-account@project-id.iam.gserviceaccount.com
$BFF_BASE_URL = "https://gen-lang-client-0837543731.an.r.appspot.com"

# 1. Draft Generation (Every 5 minutes)
# Endpoint: POST /api/worker/draft-generation
Write-Host "Creating Draft Generation Job..."
gcloud scheduler jobs create http draft-generation-job `
    --project=$PROJECT_ID `
    --location=$LOCATION `
    --schedule="*/5 * * * *" `
    --uri="$BFF_BASE_URL/api/worker/draft-generation" `
    --http-method=POST `
    --oidc-service-account-email=$SERVICE_ACCOUNT_EMAIL `
    --oidc-token-audience="$BFF_BASE_URL/api/worker/draft-generation" `
    --description="Triggers AI Draft Generation every 5 minutes"

# 2. Batch Check (Every 10 minutes)
# Endpoint: POST /api/worker/batch-check
Write-Host "Creating Batch Check Job..."
gcloud scheduler jobs create http batch-check-job `
    --project=$PROJECT_ID `
    --location=$LOCATION `
    --schedule="*/10 * * * *" `
    --uri="$BFF_BASE_URL/api/worker/batch-check" `
    --http-method=POST `
    --oidc-service-account-email=$SERVICE_ACCOUNT_EMAIL `
    --oidc-token-audience="$BFF_BASE_URL/api/worker/batch-check" `
    --description="Checks status of long-running AI Batch jobs"

Write-Host "Scheduler Jobs Created Successfully!"
