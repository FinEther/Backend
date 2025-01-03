pipeline {
    agent any
    environment {
        DOCKER_IMAGE_PREFIX = 'badryb/finether'
        // Port forwarding configuration
        USER_SERVICE_PORT = '8001:8001'
        BANK_SERVICE_PORT = '8002:8002'
        ACCOUNTS_SERVICE_PORT = '8003:8003'
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
                        bat 'docker build -t %DOCKER_IMAGE_PREFIX%-user-service -f user_service/Dockerfile ./user_service'
                    }
                }
                stage('Build Bank Service Image') {
                    steps {
                        echo 'Building Docker image for bank-service...'
                        bat 'docker build -t %DOCKER_IMAGE_PREFIX%-bank-service -f bank_service/Dockerfile ./bank_service'
                    }
                }
                stage('Build Accounts Service Image') {
                    steps {
                        echo 'Building Docker image for accounts-service...'
                        bat 'docker build -t %DOCKER_IMAGE_PREFIX%-accounts-service -f accounts_service/Dockerfile ./accounts_service'
                    }
                }
            }
        }

        stage('Push Docker Images') {
            parallel {
                stage('Push User Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat '''
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push %DOCKER_IMAGE_PREFIX%-user-service
                            '''
                        }
                    }
                }
                stage('Push Bank Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat '''
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push %DOCKER_IMAGE_PREFIX%-bank-service
                            '''
                        }
                    }
                }
                stage('Push Accounts Service Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'DockerHub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            bat '''
                                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                                docker push %DOCKER_IMAGE_PREFIX%-accounts-service
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy Monitoring Stack') {
            steps {
                echo 'Deploying monitoring stack...'
                withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                    bat '''
                        kubectl apply -f monitoring/prometheus/prometheus-configmap.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/prometheus-rbac.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/node-exporter.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/kube-state-metrics.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/prometheus/prometheus-deployment.yaml --kubeconfig=%KUBECONFIG%
                        kubectl apply -f monitoring/grafana/grafana-deployment.yaml --kubeconfig=%KUBECONFIG%
                    '''
                }
            }
        }

        stage('Deploy Services and Databases') {
            parallel {
                stage('Deploy User Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f user_service/k8s/db-users.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f user_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy Bank Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f bank_service/k8s/db-bank.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f bank_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy Accounts Service Stack') {
                    steps {
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f accounts_service/k8s/db-accounts.yaml --kubeconfig=%KUBECONFIG%
                                kubectl apply -f accounts_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
            }
        }

        stage('Verify Deployments') {
            steps {
                withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                    bat '''
                        kubectl get pods --kubeconfig=%KUBECONFIG%
                    '''
                }
            }
        }

        stage('Setup Port Forwarding') {
    steps {
        echo 'Setting up port forwarding for services and monitoring tools...'
        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
            bat '''
                @echo off
                setlocal enabledelayedexpansion
                
                REM Ensure no encoding issues
                chcp 65001 >nul

                REM Kill existing port-forward processes
                echo Killing existing port-forward processes...
                FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr "8001 8002 8003 9090 3000"') DO (
                    echo Terminating process with PID %%P...
                    TaskKill /PID %%P /F /T 2>NUL
                )
                
                REM Start port forwarding for services
                echo Starting port forwarding for services...
                start "User Service Port Forward" cmd /c kubectl port-forward service/user-service %USER_SERVICE_PORT% --kubeconfig=%KUBECONFIG%
                start "Bank Service Port Forward" cmd /c kubectl port-forward service/bank-service %BANK_SERVICE_PORT% --kubeconfig=%KUBECONFIG%
                start "Accounts Service Port Forward" cmd /c kubectl port-forward service/accounts-service %ACCOUNTS_SERVICE_PORT% --kubeconfig=%KUBECONFIG%
                
                REM Start port forwarding for monitoring tools
                echo Starting port forwarding for monitoring tools...
                start "Prometheus Port Forward" cmd /c kubectl port-forward service/prometheus-service %PROMETHEUS_PORT% --kubeconfig=%KUBECONFIG%
                start "Grafana Port Forward" cmd /c kubectl port-forward service/grafana %GRAFANA_PORT% --kubeconfig=%KUBECONFIG%
                
                REM Wait a few seconds to ensure port forwarding is established
                echo Waiting for port forwarding to establish...
                timeout /t 10 /nobreak
                
                REM Verify port forwarding
                echo Verifying port forwarding...
                netstat -an | findstr "8001 8002 8003 9090 3000"
            '''
        }
    }
}

}

    }

    post {
        success {
            echo '''
                Pipeline completed successfully! 
                Services are accessible at:
                - User Service: http://localhost:8001
                - Bank Service: http://localhost:8002
                - Accounts Service: http://localhost:8003
                Monitoring tools:
                - Prometheus: http://localhost:9090
                - Grafana: http://localhost:3000
            '''
        }
        failure {
            echo "Pipeline failed. Please check the logs for details."
            bat '''
                REM Cleanup port forwarding on failure
                FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr "8001 8002 8003 9090 3000"') DO TaskKill /PID %%P /F /T 2>NUL
            '''
        }
        always {
            echo "Pipeline execution completed. Deployment status can be checked in Kubernetes dashboard."
        }
    }
}