# How to Add a New StromWater Device

This guide will help you add additional StromWater devices to your monitoring system.

---

## Quick Steps

### 1. **Edit Device Information**

Open `add-new-device.sql` and change these values:

```sql
INSERT INTO devices (
  device_id,           -- Change to: 'StromWater_Device_2'
  device_name,         -- Change to: 'Your Pump Station Name'
  location,            -- Change to: 'Your Location'
  latitude,            -- Change to: Your GPS latitude
  longitude,           -- Change to: Your GPS longitude
  is_active
) VALUES (
  'StromWater_Device_2',
  'Sharjah Industrial Pump Station',
  'Sharjah Industrial Area',
  25.3463,
  55.4209,
  true
);
```

### 2. **Add Device to Database**

Run the batch file:
```
Double-click: ADD-NEW-DEVICE.bat
```

This will:
- Add the device to the database
- Show you the list of all devices
- Confirm the device was added

### 3. **Configure MQTT Device**

Your physical IoT device should publish to:

**MQTT Topic:**
```
devices/StromWater_Device_2/data
```

**MQTT Broker:**
```
localhost:1883 (for local testing)
or
your.vps.ip.address:1883 (for production)
```

**Message Format:**
```json
{
  "deviceId": "StromWater_Device_2",
  "location": "Sharjah Industrial Area",
  "timestamp": "2025-10-21T10:30:00.000Z",
  "data": {
    "Hydrostatic_Value": 55.5,
    "DryRunAlert": 0,
    "HighLevelFloatAlert": 0,
    "Pump_1_Manual": 0,
    "Pump_1_Auto": 1,
    "Pump_1_Protection": 0,
    "Pump_1_Contactor_Feedback": 1,
    "Pump_2_Manual": 0,
    "Pump_2_Auto": 1,
    "Pump_2_Protection": 0,
    "Pump_2_Contactor_Feedback": 0,
    "POWER_1_R": 100.5,
    "POWER_1_Y": 102.3,
    "POWER_1_B": 101.8,
    "IRMS_1_R": 5.2,
    "IRMS_1_Y": 5.3,
    "IRMS_1_B": 5.1,
    "VRMS_1_R": 230.5,
    "VRMS_1_Y": 231.2,
    "VRMS_1_B": 229.8,
    "VAHR_1_R": 50,
    "VAHR_1_Y": 52,
    "VAHR_1_B": 51,
    "FREQ_1_R": 50.0,
    "FREQ_1_Y": 50.1,
    "FREQ_1_B": 49.9,
    "POWER_2_R": 98.5,
    "POWER_2_Y": 99.3,
    "POWER_2_B": 97.8,
    "IRMS_2_R": 4.8,
    "IRMS_2_Y": 4.9,
    "IRMS_2_B": 4.7,
    "VRMS_2_R": 229.5,
    "VRMS_2_Y": 230.2,
    "VRMS_2_B": 228.8,
    "VAHR_2_R": 45,
    "VAHR_2_Y": 47,
    "VAHR_2_B": 46,
    "FREQ_2_R": 49.9,
    "FREQ_2_Y": 50.0,
    "FREQ_2_B": 50.1,
    "RHS_1": 5,
    "RHS_2": 3
  }
}
```

### 4. **Test with Simulator (Optional)**

For testing, you can use the simulator:

**Edit the simulator:**
1. Open `test-mqtt-device2.js`
2. Change `DEVICE_ID` and `DEVICE_LOCATION` if needed

**Run the simulator:**
```
Double-click: start-simulator-device2.bat
```

The simulator will publish test data every 5 seconds.

### 5. **View Device on Dashboard**

1. Open dashboard: `http://localhost:3000`
2. Login with: `admin` / `admin123`
3. You should see a **device selector dropdown** at the top
4. Select between Device 1 and Device 2
5. All metrics will update for the selected device

---

## Dashboard Device Selector

When you have multiple devices, the dashboard will show a dropdown:

```
┌──────────────────────────────────────┐
│  Dashboard                           │
│  ┌────────────────────────────────┐ │
│  │ Device: StromWater_Device_1 ▼ │ │
│  └────────────────────────────────┘ │
│                                      │
│  [Device metrics and charts...]     │
└──────────────────────────────────────┘
```

Selecting a device will:
- Show live data for that device
- Update all charts and metrics
- Show device location on map
- Display device-specific pump status

---

## Multiple Device Benefits

✅ **Compare Performance** - Switch between devices to compare
✅ **Centralized Monitoring** - Monitor all pump stations from one dashboard
✅ **Individual Analysis** - Each device has its own data, trends, and alerts
✅ **Scalable** - Add as many devices as needed
✅ **Location Mapping** - Each device shows on its own map location

---

## Adding More Devices

To add Device 3, 4, 5, etc.:

1. **Edit** `add-new-device.sql`:
   - Change `device_id` to `StromWater_Device_3`
   - Update name, location, coordinates

2. **Run** `ADD-NEW-DEVICE.bat`

3. **Configure** your IoT device to publish to:
   - Topic: `devices/StromWater_Device_3/data`

4. **Repeat** for each additional device

---

## Troubleshooting

### Device not appearing in dropdown?
- Make sure device is added to database
- Check that device is sending MQTT data
- Verify the topic format: `devices/[DEVICE_ID]/data`
- Check backend logs for MQTT messages

### No data showing for device?
- Verify MQTT simulator/device is running
- Check device_id matches exactly
- Look at backend console for errors
- Ensure backend is running and connected to MQTT

### Device showing but old data?
- Device might not be sending data currently
- Check `last_seen` timestamp in database:
  ```sql
  SELECT device_id, last_seen FROM devices;
  ```

---

## Database Queries (Useful)

**List all devices:**
```sql
SELECT device_id, device_name, location, is_active, last_seen
FROM devices;
```

**Count data per device:**
```sql
SELECT device_id, COUNT(*) as record_count
FROM device_data
GROUP BY device_id;
```

**Check latest data for each device:**
```sql
SELECT DISTINCT ON (device_id)
  device_id, timestamp, hydrostatic_value
FROM device_data
ORDER BY device_id, timestamp DESC;
```

**Deactivate a device:**
```sql
UPDATE devices
SET is_active = false
WHERE device_id = 'StromWater_Device_2';
```

---

## Production Deployment

When deploying to production VPS:

1. Each physical device publishes to the same MQTT broker
2. Use unique device IDs for each pump station
3. Configure GPS coordinates accurately for map display
4. Set up SSL/TLS for MQTT if over internet
5. Use authentication for MQTT connections

---

**Ready to add your second device?**

1. Edit: `add-new-device.sql`
2. Run: `ADD-NEW-DEVICE.bat`
3. Test: `start-simulator-device2.bat`
4. Check: Dashboard device selector dropdown

