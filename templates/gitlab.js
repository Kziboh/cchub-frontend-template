
const generateGitlabScript =(
    nodeVersion="22",
    awsRegion="us-east-2",
    awsRoleArn="arn:aws:iam::272639848682:role/Gitlab-ci"
)=>{
    return `
image: node:${nodeVersion}

cache:
  paths:
    - node_modules/

stages:
  - npm
  - test
  - deploy-to-stage
  - deploy-to-prod

npm:
  stage: npm
  script:
    - npm ci --legacy-peer-deps
  cache:
    paths:
      - node_modules/
  artifacts:
    expire_in: 1 day
    when: on_success
    paths:
      - node_modules/
  only:
    - merge_requests

test:
  stage: test
  dependencies:
    - npm
  script:
    - npm test --if-present
  only:
    - merge_requests

deploy-to-stage:
  stage: deploy-to-stage
  before_script:
    - "which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )"
    - mkdir -p ~/.ssh
    - printf '%b\\n' "$STAGE_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - '[[ -f /.dockerenv ]] && printf "Host *\\n\\tStrictHostKeyChecking no\\n\\n" > ~/.ssh/config'
  script:
    - bash deploy/stage_deploy.sh
  rules:
    - if: $CI_COMMIT_BRANCH == "dev"
  environment:
    name: staging

deploy-to-prod:
  stage: deploy-to-prod
  when: manual
  allow_failure: false
  image:
    name: amazon/aws-cli:latest
    entrypoint: [""] # ← This overrides the aws entrypoint, allowing normal shell execution
  id_tokens:
    AWS_OIDC_TOKEN:
      aud: gitlab.com
  variables:
    AWS_ROLE_ARN: "${awsRoleArn}"
    AWS_REGION: ${awsRegion}
    AWS_DEFAULT_REGION: ${awsRegion}
  before_script:
    - >
      export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s"
      $(aws sts assume-role-with-web-identity
      --role-arn $AWS_ROLE_ARN
      --role-session-name gitlab-ci-prod-session
      --web-identity-token $AWS_OIDC_TOKEN
      --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]"
      --output text))
    - aws sts get-caller-identity
  script:
    - bash deploy/prod_deploy.sh
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  environment:
    name: production
`
}

export default generateGitlabScript;
