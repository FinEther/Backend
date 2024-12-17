pipeline {
    agent any
    environment {
        DOCKER_IMAGE_PREFIX = 'badryb/fintech' // Préfixe des images Docker
    }
    triggers {
        githubPush() // Déclenchement sur push GitHub
    }
    stages {
        stage('Clone Repository') {
            steps {
                echo 'Clonage du repository...'
                checkout scm
            }
        }
        stage('Build Docker Images') {
            parallel {
                stage('Build User Service Image') {
                    steps {
                        echo 'Construction de l\'image Docker pour user_service...'
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-user-service -f user_service/Dockerfile user_service
                        '''
                    }
                }
                stage('Build Bank Service Image') {
                    steps {
                        echo 'Construction de l\'image Docker pour bank_service...'
                        bat '''
                            docker build -t %DOCKER_IMAGE_PREFIX%-bank-service -f bank_service/Dockerfile bank_service
                        '''
                    }
                }
                stage('Build Accounts Service Image') {
                    steps {
                        echo 'Construction de l\'image Docker pour accounts_service...'
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
                        echo 'Poussée de l\'image user_service vers Docker Hub...'
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
                        echo 'Poussée de l\'image bank_service vers Docker Hub...'
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
                        echo 'Poussée de l\'image accounts_service vers Docker Hub...'
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
            steps {
                echo 'Déploiement des services sur Kubernetes...'
                withCredentials([file(credentialsId: 'MyKubeConfig', variable: 'KUBECONFIG')]) {
                    bat '''
                        kubectl apply -f k8s/ --kubeconfig=%KUBECONFIG%
                        kubectl rollout status deployment/user-service --kubeconfig=%KUBECONFIG%
                        kubectl rollout status deployment/bank-service --kubeconfig=%KUBECONFIG%
                        kubectl rollout status deployment/accounts-service --kubeconfig=%KUBECONFIG%
                    '''
                }
            }
        }
    }
    post {
        success {
            echo 'Le pipeline a été exécuté avec succès pour tous les services.'
        }
        failure {
            echo 'Le pipeline a échoué. Vérifiez les logs pour plus de détails.'
        }
    }
}
