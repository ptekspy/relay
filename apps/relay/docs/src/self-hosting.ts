export class RelaySelfHostingGuide {
  public getDockerComposeTemplate(): string {
    return `version: '3.8'

services:
  relay-edge:
    image: ghcr.io/paddy-systems/relay-edge:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
      - "7331:7331"
    environment:
      - RELAY_ENV=production
      - RELAY_DOMAIN=relay.internal.company.com
      - RELAY_TLS_AUTO=letsencrypt
      - RELAY_MAX_SESSIONS=1000
    volumes:
      - ./certs:/etc/relay/certs
      - ./data:/var/lib/relay

  relay-turn:
    image: coturn/coturn:latest
    restart: always
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
      - "5349:5349/tcp"
    environment:
      - TURN_SECRET=enterprise-turn-auth-key-change-me
`;
  }

  public getKubernetesManifestTemplate(): string {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: relay-edge-gateway
  namespace: relay-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: relay-edge
  template:
    metadata:
      labels:
        app: relay-edge
    spec:
      containers:
      - name: gateway
        image: ghcr.io/paddy-systems/relay-edge:latest
        ports:
        - containerPort: 7331
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
`;
  }
}

export const relaySelfHostingGuide = new RelaySelfHostingGuide();
