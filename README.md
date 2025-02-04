# FinTech Microservices Application

An innovative platform integrating **Microservices**, **Blockchain**, and **Web3**, designed for seamless and secure financial operations.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Setup Instructions](#setup-instructions)
4. [Microservices Architecture](#microservices-architecture)
5. [Security Measures](#security-measures)
6. [DevOps Workflow](#devops-workflow)
7. [Monitoring and Observability](#monitoring-and-observability)
8. [Deployment Details](#deployment-details)
9. [Contributors](#contributors)

---

## Project Overview

This application utilizes cutting-edge technologies to deliver high-performance financial services. Features include:

- Microservices for modularity and scalability.
- Blockchain and Web3 integration for secure and transparent transactions.
- Containerized services for simplified deployment and scalability.
- REST API for communication between microservices.
- Comprehensive monitoring and security measures.

## Architecture Diagram

![Architecture Diagram](./figures/Architecture.png "System Architecture")

## Application Interface

![Application Interface](./figures/image.png "Application Interface")

## Homepage

![Homepage](./figures/image_2025-01-11_195356237.png "Homepage")

---

## Tech Stack

- **Programming Languages:** Python, FastAPI.
- **Frontend:** Angular TS.
- **DevOps Tools:** Docker, Kubernetes, Jenkins, Minikube, k9s.
- **Database:** PostgreSQL for each microservice.
- **Blockchain:** Sepolia Ethereum testnet integrated with Metamask.
- **Monitoring:** Prometheus and Grafana.

---

## Setup Instructions

### Option 1: Run Using Docker and Kubernetes

1. **Clone the repository**:

   ```bash
   git clone https://github.com/FinEther/Backend.git
   cd fintech-app
   ```

2. **Configure the `.env` files**:  
   Set up the `.env` files for each microservice with the required environment variables.

3. **Build and start the containers**:

   ```bash
   docker-compose up --build
   ```

4. **Deploy services on Kubernetes**:

   ```bash
   kubectl apply -f <service-name>/k8s/
   ```

5. **Access the frontend**:  
   Open your browser and navigate to:
   ```
   http://localhost:<frontend-port>
   ```

---

### Option 2: Run Using Jenkins Pipeline

1. **Install Jenkins**:  
   Ensure Jenkins is installed, running, and accessible.

2. **Create a new pipeline**:

   - Log in to the Jenkins dashboard.
   - Click **New Item**.
   - Select **Pipeline**, enter a name, and click **OK**.

3. **Configure the pipeline**:

   - In the pipeline settings, scroll to the **Pipeline** section.
   - Set **Definition** to **Pipeline script from SCM**.
   - Choose **Git** as the SCM and provide the repository URL:
     ```plaintext
     https://github.com/FinEther/Backend.git
     ```
   - Specify the branch (e.g., `main` or `master`).

4. **Trigger the pipeline**:  
   Click **Build Now** in Jenkins to clone the repository, build the project, and deploy the services.

5. **Automate the pipeline** (optional):

   - Add a webhook in GitHub to trigger the pipeline on code changes:
     - Go to your GitHub repository **Settings**.
     - Click **Webhooks** > **Add webhook**.
     - Set the payload URL to:
       ```
       http://<jenkins-server>:8080/github-webhook/
       ```

6. **Monitor progress**:  
   View the logs in Jenkins to track the pipeline status.

7. **Access the frontend**:  
   Once the pipeline completes, access the frontend at:
   ```
   http://localhost:<frontend-port>
   ```

---

## Microservices Architecture

The application consists of the following services:

1. **User Service (user-svc):** Handles user registration, authentication, and profile management.
2. **Bank Service (bank-svc):** Manages bank-related operations such as loan processing and account linking.
3. **Accounts Service (accounts-svc):** Provides account-related functionalities, including account details and balances.
4. **Blockchain Service (blockchain-svc):** Records cryptocurrency transactions using the Sepolia Ethereum testnet and Metamask.
5. **API Gateway Service:** Serves as a single entry point to route requests to the appropriate microservice, including JWT authentication.
6. **Frontend Service:** User interface for interacting with the platform.

**Communication:**

- **REST APIs:** Synchronous communication.

**Database Design:**

- Each microservice has its own PostgreSQL database for data isolation and scalability.

---

## Security Measures

1. **API Gateway:** Manages routing and centralizes authentication using JWT.
2. **Authentication:** Secure token-based authentication.
3. **Encryption:** Sensitive data is encrypted at rest and in transit.
4. **Blockchain Transactions:** Transactions are recorded on the Sepolia testnet for tamper-proof integrity.

---

## DevOps Workflow

1. **CI/CD Pipeline:**
   - Automated pipelines using Jenkins for builds, tests, and deployments.
   - Dockerized services for consistent deployments.
2. **Container Orchestration:**
   - Kubernetes for managing containerized workloads.
   - Minikube for local development and testing.
   - k9s for managing Kubernetes clusters.
3. **Deployment:**
   - YAML manifests for Kubernetes deployments, services, and config maps.

---

## Monitoring and Observability

- **Prometheus:** Collects metrics from microservices and Kubernetes nodes.
- **Grafana:** Visualizes application performance metrics and resource usage.

### Figures

- **Docker Hub Overview:**
  ![Dockerhub](./figures/Dockerhub.png)

- **Jenkins Pipeline Overview:**
  ![Jenkins Pipeline](./figures/jenkins%20pipeline.png)

- **K9s Dashboard:**
  ![K9s](./figures/K9s.png)

- **Kubernetes Cluster Dashboard:**
  ![Kubernetes Cluster](./figures/Kubernetes%20Cluster%20dashboard.png)

- **Node Exporter Metrics:**
  ![Node Exporter](./figures/Node%20Exporter%20dashboard.png)

---

## Deployment Details

The application supports:

1. **Local Deployment:**

   - Uses Docker Compose for local testing.

2. **Kubernetes Deployment:**

   - Kubernetes cluster managed with kubectl & K9S.

---

## Contributors

- **Backend Developer:** AFROUKH Abdellah
- **DevOps Engineer:** BAY BAY Badr
- **Blockchain & Web3:** MOUTMAINE Aymane
- **UI/UX Designer:** SENBATI Nizar

---
