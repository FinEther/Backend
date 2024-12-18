pipeline {
    agent any
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'  // Docker Compose file
        IMAGE_TAG = "latest"  // Docker image tag for each service
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out the repository..."
                    checkout scm  // Checkout the repository
                }
            }
        }

        stage('Build Services') {
            steps {
                script {
                    echo "Building Docker services..."
                    // Build the services with error handling
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% build || exit 1"
                }
            }
        }

        stage('Start Services') {
            steps {
                script {
                    echo "Starting Docker services..."
                    // Start the services in detached mode with error handling
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% up -d || exit 1"
                }
            }
        }

        stage('Wait for DB to be Ready') {
            steps {
                script {
                    echo "Waiting for PostgreSQL to be ready..."
                    // Retry logic for waiting for PostgreSQL readiness
                    def retries = 30
                    def success = false
                    for (int i = 0; i < retries; i++) {
                        def result = bat(script: "docker-compose -f %DOCKER_COMPOSE_FILE% exec -T db pg_isready -U postgres", returnStatus: true)
                        if (result == 0) {
                            success = true
                            echo "PostgreSQL is ready."
                            break
                        }
                        echo "PostgreSQL is not ready yet, retrying (${i + 1}/${retries})..."
                        sleep(time: 10, unit: 'SECONDS') // Wait for 10 seconds before retrying
                    }
                    if (!success) {
                        error "PostgreSQL is not ready after ${retries} attempts. Exiting pipeline."
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo "Running tests for the accounts_service..."
                    // Run tests with error handling
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% exec -T accounts_service pytest tests/ || exit 1"
                }
            }
        }

        stage('Stop Services') {
            steps {
                script {
                    echo "Stopping Docker services..."
                    // Stop the services gracefully
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% down || exit 1"
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Cleaning up Docker resources..."
                // Ensure all resources are cleaned up
                bat "docker-compose -f %DOCKER_COMPOSE_FILE% down --volumes --remove-orphans || echo 'Cleanup already performed or containers not running.'"
            }
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Please check logs for details."
        }
    }
}
