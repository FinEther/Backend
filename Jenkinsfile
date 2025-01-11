pipeline {
    agent any
    environment {
        DOCKER_IMAGE_PREFIX = 'badryb/finether'
        USER_SERVICE_PORT = '8001:8001'
        BANK_SERVICE_PORT = '8002:8002'
        ACCOUNTS_SERVICE_PORT = '8003:8003'
        NOTIFICATION_SERVICE_PORT = '8004:8004'
        FRONTEND_PORT = '4200:80'
        BLOCKCHAIN_SERVICE_PORT = '8501:8501'
        PROMETHEUS_PORT = '9090:9090'
        GRAFANA_PORT = '3000:3000'
    }
    triggers {
        githubPush()
    }
    stages {
        stage('Clone Repository') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build User Service Image') {
                    steps {
                        echo 'Building Docker image for user-service...'
                        bat "docker build -t ${DOCKER_IMAGE_PREFIX}-user-service -f user_service/Dockerfile ./user_service"
                    }
                }
                stage('Build Bank Service Image') {
                    steps {
                        echo 'Building Docker image for bank-service...'
                        bat "docker build -t ${DOCKER_IMAGE_PREFIX}-bank-service -f bank_service/Dockerfile ./bank_service"
                    }
                }
                stage('Build Accounts Service Image') {
                    steps {
                        echo 'Building Docker image for accounts-service...'
                        bat "docker build -t ${DOCKER_IMAGE_PREFIX}-accounts-service -f accounts_service/Dockerfile ./accounts_service"
                    }
                }
                stage('Build Notification Service Image') {
                    steps {
                        echo 'Building Docker image for notification-service...'
                        bat "docker build -t ${DOCKER_IMAGE_PREFIX}-notification-service -f notification_service/Dockerfile ./notification_service"
                    }
                }
                
                stage('Build Frontend Image') {
                    steps {
                        echo 'Building Docker image for frontend...'
                        bat "docker build -t ${DOCKER_IMAGE_PREFIX}-frontend -f Fintech_Front-End-main/Dockerfile ./Fintech_Front-End-main"
                    }
                }
                stage('Build API Gateway Image') {
                    steps {
                        echo 'Building Docker image for API Gateway...'
                        bat "docker build -t ${DOCKER_IMAGE_PREFIX}-gateway -f gateway/Dockerfile ./gateway"
                    }
                }
            }
        }

        stage('Push Docker Images') {
            parallel {
                stage('Push User Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat """
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push ${DOCKER_IMAGE_PREFIX}-user-service
                            """
                        }
                    }
                }
                stage('Push Bank Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat """
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push ${DOCKER_IMAGE_PREFIX}-bank-service
                            """
                        }
                    }
                }
                stage('Push Accounts Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat """
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push ${DOCKER_IMAGE_PREFIX}-accounts-service
                            """
                        }
                    }
                }
                stage('Push Notification Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat """
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push ${DOCKER_IMAGE_PREFIX}-notification-service
                            """
                        }
                    }
                }
                
                stage('Push Frontend Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat """
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push ${DOCKER_IMAGE_PREFIX}-frontend
                            """
                        }
                    }
                }
                stage('Push API Gateway Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat """
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push ${DOCKER_IMAGE_PREFIX}-gateway
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy Monitoring Stack') {
            steps {
                echo 'Deploying monitoring stack...'
                withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                    bat """
                        kubectl apply -f monitoring/prometheus/prometheus-configmap.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/prometheus-rbac.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/node-exporter.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/kube-state-metrics.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/prometheus-deployment.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/grafana/grafana-deployment.yaml --kubeconfig=%KUBECONFIG%
                    """
                }
            }
        }

        stage('Deploy Services and Databases') {
            parallel {
                stage('Deploy User Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat """
                                kubectl apply -f user_service/k8s/db-users.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f user_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            """
                        }
                    }
                }
                stage('Deploy Bank Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat """
                                kubectl apply -f bank_service/k8s/db-bank.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f bank_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            """
                        }
                    }
                }
                stage('Deploy Accounts Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat """
                                kubectl apply -f accounts_service/k8s/db-accounts.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f accounts_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            """
                        }
                    }
                }
                stage('Deploy Notification Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat """
                                kubectl apply -f notification_service/k8s/db-notifications.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f notification_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            """
                        }
                    }
                }
                
                stage('Deploy Frontend Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat """
                                kubectl apply -f Fintech_Front-End-main/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            """
                        }
                    }
                }
                stage('Deploy API Gateway Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat """
                                kubectl apply -f gateway/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo '''
                Pipeline completed successfully!
                Services are accessible:
                - User Service: http://localhost:8001
                - Bank Service: http://localhost:8002
                - Accounts Service: http://localhost:8003
                - Notification Service: http://localhost:8004
                - Blockchain Service: http://localhost:8501
                - Frontend: http://localhost:4200
                Monitoring:
                - Prometheus: http://localhost:9090
                - Grafana: http://localhost:3000
            '''
        }
        failure {
            echo 'Pipeline failed.'
        }
        always {
            echo 'Pipeline completed. Verify services via the Kubernetes dashboard.'
        }
    }
}
