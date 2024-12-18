pipeline {
    agent any
    environment {
        DOCKER_IMAGE_PREFIX = 'badryb/finether' // Docker Hub repository
    }
    triggers {
        githubPush() // Trigger on GitHub push events
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
                            docker build -t %DOCKER_IMAGE_PREFIX%-user-service -f user_service/Dockerfile user_service
                        '''
                    }
                }
                stage('Build Bank Service Image') {
                    steps {
                        echo 'Building Docker image for bank-service...'
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-bank-service -f bank_service/Dockerfile bank_service
                        '''
                    }
                }
                stage('Build Accounts Service Image') {
                    steps {
                        echo 'Building Docker image for accounts-service...'
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-accounts-service -f accounts_service/Dockerfile accounts_service
                        '''
                    }
                }
            }
        }
        stage('Push to Docker Hub') {
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
        stage('Deploy to Kubernetes') {
            parallel {
                stage('Deploy Database') {
                    steps {
                        echo 'Deploying database to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig3', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f db/pvc.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f db/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f db/service.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy User Service') {
                    steps {
                        echo 'Deploying user-service to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig3', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f user_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f user_service/k8s/service.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy Bank Service') {
                    steps {
                        echo 'Deploying bank-service to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig3', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f bank_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f bank_service/k8s/service.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
                stage('Deploy Accounts Service') {
                    steps {
                        echo 'Deploying accounts-service to Kubernetes...'
                        withCredentials([file(credentialsId: 'MyKubeConfig3', variable: 'KUBECONFIG')]) {
                            bat '''
                                kubectl apply -f accounts_service/k8s/deployment.yml --kubeconfig=%KUBECONFIG% 
                                kubectl apply -f accounts_service/k8s/service.yml --kubeconfig=%KUBECONFIG%
                            '''
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            echo "Application deployed successfully!"
        }
        failure {
            echo "Deployment failed. Check the logs for details."
        }
    }
}
