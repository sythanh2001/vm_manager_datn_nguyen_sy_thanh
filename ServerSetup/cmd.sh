# https://docs.docker.com/engine/install/ubuntu/
mkdir -p /etc/prometheus
cp prometheus.yml /etc/prometheus

mkdir -p /etc/grafana
cp grafana.ini /etc/grafana

# Make ssl file suport https
# Generate a private key
openssl genpkey -algorithm RSA -out grafana-key.pem

# Create a self-signed certificate
openssl req -new -key grafana-key.pem -x509 -out grafana.pem -days 365

mkdir -p /etc/grafana/ssl
sudo chown -R 472:472 /etc/grafana/ssl
cp grafana.pem /etc/grafana/ssl/
cp grafana-key.pem /etc/grafana/ssl/