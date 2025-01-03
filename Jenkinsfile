pipeline {
    agent any
    environment {
        DOCKER_IMAGE_PREFIX = 'badryb/finether'
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
    }

    post {
        success {
            echo "Pipeline completed successfully! All services and monitoring stack are deployed."
        }
        failure {
            echo "Pipeline failed. Please check the logs for details."
        }
        always {
            echo "Pipeline execution completed. Deployment status can be checked in Kubernetes dashboard."
        }
    }
}