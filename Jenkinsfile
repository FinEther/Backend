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
                    // Use 'docker-compose' commands for Windows (use 'bat' instead of 'sh')
                    bat 'docker-compose -f ${DOCKER_COMPOSE_FILE} build'
                }
            }
        }

        stage('Start Services') {
            steps {
                script {
                    // Start the containers in detached mode
                    bat 'docker-compose -f ${DOCKER_COMPOSE_FILE} up -d'
                }
            }
        }

        stage('Wait for DB to be Ready') {
            steps {
                script {
                    // Optionally, wait for the database service to be ready before running tests
                    // Use a check for PostgreSQL readiness (adjust for your DB if needed)
                    bat 'docker-compose -f ${DOCKER_COMPOSE_FILE} exec -T db pg_isready -U postgres'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Run your test commands for your microservices here
                    // Example: Run integration tests on the user_service, bank_service, etc.
                    bat 'docker-compose -f ${DOCKER_COMPOSE_FILE} exec -T accounts_service pytest tests/'
                }
            }
        }

        stage('Stop Services') {
            steps {
                script {
                    // Stop the services once tests are completed
                    bat 'docker-compose -f ${DOCKER_COMPOSE_FILE} down'
                }
            }
        }
    }

    post {
        always {
            // Clean up and stop services after every pipeline run
            bat 'docker-compose -f ${DOCKER_COMPOSE_FILE} down --volumes --remove-orphans'
        }
    }
}
