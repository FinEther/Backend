pipeline {
    agent any
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'  // Docker Compose file
        IMAGE_TAG = "latest"  // Docker image tag for each service
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm  // Checkout the repository
            }
        }

        stage('Build Services') {
            steps {
                script {
                    // Build the services
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% build"
                }
            }
        }

        stage('Start Services') {
            steps {
                script {
                    // Start the services in detached mode
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% up -d"
                }
            }
        }

        stage('Wait for DB to be Ready') {
            steps {
                script {
                    // Retry logic for waiting for PostgreSQL readiness
                    def retries = 10
                    def success = false
                    for (int i = 0; i < retries; i++) {
                        def result = bat(script: "docker-compose -f %DOCKER_COMPOSE_FILE% exec -T db pg_isready -U postgres", returnStatus: true)
                        if (result == 0) {
                            success = true
                            break
                        }
                        sleep(time: 5, unit: 'SECONDS') // Wait for 5 seconds before retrying
                    }
                    if (!success) {
                        error "PostgreSQL is not ready after ${retries} attempts"
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Run tests for the services
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% exec -T accounts_service pytest tests/"
                }
            }
        }

        stage('Stop Services') {
            steps {
                script {
                    // Stop the services
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% down"
                }
            }
        }
    }

    post {
        always {
            // Clean up after pipeline run
            bat "docker-compose -f %DOCKER_COMPOSE_FILE% down --volumes --remove-orphans"
        }
    }
}
