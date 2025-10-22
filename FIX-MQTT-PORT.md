# Fix MQTT Port 1883 - Manual Commands

Since SSH isn't working from Windows, use **AWS EC2 Console** to run these commands.

---

## Access VPS

1. Login to **AWS Console**: https://console.aws.amazon.com/
2. Go to **EC2** → **Instances**
3. Find instance with IP `43.205.194.142`
4. Click **Connect** → Use **EC2 Instance Connect**

---

## Commands to Run

Copy and paste these commands into the AWS Console terminal:

```bash
# Check current firewall status
sudo ufw status numbered

# Allow MQTT port 1883
sudo ufw allow 1883/tcp
sudo ufw allow 1883/udp

# Reload firewall
sudo ufw reload

# Check Mosquitto is listening on all interfaces
sudo netstat -tlnp | grep 1883

# Should show: tcp 0.0.0.0:1883 0.0.0.0:* LISTEN
# If it shows 127.0.0.1:1883, continue below:

# Check Mosquitto config
cat /etc/mosquitto/mosquitto.conf

# Update config to listen on all interfaces
sudo nano /etc/mosquitto/mosquitto.conf

# Make sure it has:
# listener 1883 0.0.0.0
# allow_anonymous false
# password_file /etc/mosquitto/passwd

# Restart Mosquitto
sudo systemctl restart mosquitto

# Verify it's listening on 0.0.0.0
sudo netstat -tlnp | grep 1883

# Test MQTT locally
mosquitto_pub -h localhost -p 1883 -t "test" -m "hello" -u stromwater_mqtt -P mqtt123 -d
```

---

## Verify from Windows

After running the commands above, test from Windows PowerShell:

```powershell
Test-NetConnection -ComputerName 43.205.194.142 -Port 1883
```

**Success**: `TcpTestSucceeded : True`

---

## If Port Still Blocked

### Check AWS Security Group

1. In AWS Console, go to **EC2** → **Security Groups**
2. Find the security group for your instance
3. Click **Edit inbound rules**
4. Verify this rule exists:
   - **Type**: Custom TCP
   - **Port**: 1883
   - **Source**: 0.0.0.0/0 (or your specific IP)
5. If missing, click **Add rule** and create it
6. Click **Save rules**

### Check Mosquitto Config

```bash
cat /etc/mosquitto/mosquitto.conf
```

Should be:
```
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd
```

**NOT**:
```
listener 1883
# or
listener 1883 127.0.0.1
```

---

## Test MQTT Publishing

Once port is open, from Windows:

```batch
node test-mqtt-both-devices.js
```

Should see:
```
✓ Connected to MQTT broker successfully!
Publishing data every 5 seconds...
```

---

**After MQTT port is fixed, your system will be fully operational!** 🚀
