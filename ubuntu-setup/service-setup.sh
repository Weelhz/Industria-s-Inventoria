
#!/bin/bash

# Setup Inventoria as a system service
echo "Setting up Inventoria as a system service..."

# Create inventoria user
sudo useradd --system --home /opt/inventoria --shell /bin/false inventoria

# Copy application to /opt/inventoria
sudo cp -r . /opt/inventoria/
sudo chown -R inventoria:inventoria /opt/inventoria

# Copy service file
sudo cp ubuntu-setup/inventoria.service /etc/systemd/system/

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable inventoria

echo "Service setup complete!"
echo "Commands:"
echo "  Start:   sudo systemctl start inventoria"
echo "  Stop:    sudo systemctl stop inventoria"
echo "  Status:  sudo systemctl status inventoria"
echo "  Logs:    sudo journalctl -u inventoria -f"
