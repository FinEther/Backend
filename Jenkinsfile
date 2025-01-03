pipeline {
    agent any
    environment {
        DOCKER_IMAGE_PREFIX = 'badryb/finether' // Docker Hub repository prefix
    }
    triggers {
        githubPush() // Trigger the pipeline on GitHub push events
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
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-user-service -f user_service/Dockerfile ./user_service
                        '''
                    }
                }
                stage('Build Bank Service Image') {
                    steps {
                        echo 'Building Docker image for bank-service...'
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-bank-service -f bank_service/Dockerfile ./bank_service
                        '''
                    }
                }
                stage('Build Accounts Service Image') {
                    steps {
                        echo 'Building Docker image for accounts-service...'
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-accounts-service -f accounts_service/Dockerfile ./accounts_service
                        '''
                    }
                }
            }
        }
        stage('Push Docker Images') {
            parallel {
                stage('Push User Service Image') {
                    steps {
                        echo 'Pushing Docker image for user-service to Docker Hub...'
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
                        echo 'Pushing Docker image for bank-service to Docker Hub...'
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
                        echo 'Pushing Docker image for accounts-service to Docker Hub...'
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
        stage('Deploy Services to Kubernetes') {
            parallel {
                stage('Deploy User Service') {
                    steps {
                        echo 'Deploying user-service to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f user_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f user_service/k8s/db-users.yaml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy Bank Service') {
                    steps {
                        echo 'Deploying bank-service to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f bank_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f bank_service/k8s/db-bank.yaml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy Accounts Service') {
                    steps {
                        echo 'Deploying accounts-service to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f accounts_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f accounts_service/k8s/db-accounts.yaml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            echo "Pipeline completed successfully and services are deployed to Kubernetes!"
        }
        failure {
            echo "Pipeline failed. Please check the logs for details."
        }
    }
}
