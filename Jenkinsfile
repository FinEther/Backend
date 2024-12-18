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
                    checkout scm  // Pull the repository
                }
            }
        }

        stage('Build and Start Services') {
            steps {
                script {
                    echo "Building and starting Docker services..."
                    // Build and start all services in detached mode
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% up -d --build || exit 1"
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Ensuring cleanup of Docker resources..."
                // Optional cleanup if needed
                bat "docker-compose -f %DOCKER_COMPOSE_FILE% down --volumes --remove-orphans || echo 'Cleanup already performed or services not running.'"
            }
        }
        success {
            echo "All services are up and running!"
        }
        failure {
            echo "Failed to start services. Please check logs for details."
        }
    }
}
