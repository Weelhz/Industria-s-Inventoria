#!/bin/bash

echo "Setting up Inventoria as a system service..."

sudo useradd --system --home /opt/inventoria --shell /bin/false inventoria

sudo cp -r . /opt/inventoria/
sudo chown -R inventoria:inventoria /opt/inventoria

sudo cp ubuntu-setup/inventoria.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable inventoria

echo "Service setup complete!"
echo "Commands:"
echo "  Start:   sudo systemctl start inventoria"
echo "  Stop:    sudo systemctl stop inventoria"
echo "  Status:  sudo systemctl status inventoria"
echo "  Logs:    sudo journalctl -u inventoria -f"
