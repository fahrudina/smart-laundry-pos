package com.smartlaundry.pos;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "ThermalPrinter",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH }, alias = "bluetooth"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_ADMIN }, alias = "bluetoothAdmin"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "bluetoothConnect"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_SCAN }, alias = "bluetoothScan")
    }
)
public class ThermalPrinterPlugin extends Plugin {

    private static final UUID PRINTER_UUID = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb");
    private BluetoothSocket bluetoothSocket;
    private OutputStream outputStream;
    private BluetoothDevice connectedDevice;

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ requires BLUETOOTH_CONNECT and BLUETOOTH_SCAN
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) 
                    != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) 
                    != PackageManager.PERMISSION_GRANTED) {
                
                requestPermissionForAlias("bluetoothConnect", call, "permissionsCallback");
                return;
            }
        } else {
            // Android 11 and below
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH) 
                    != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_ADMIN) 
                    != PackageManager.PERMISSION_GRANTED) {
                
                requestPermissionForAlias("bluetooth", call, "permissionsCallback");
                return;
            }
        }

        JSObject ret = new JSObject();
        ret.put("granted", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void listPairedDevices(PluginCall call) {
        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        
        if (bluetoothAdapter == null) {
            call.reject("Bluetooth not supported on this device");
            return;
        }

        if (!bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is not enabled");
            return;
        }

        try {
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            JSArray devicesArray = new JSArray();

            if (pairedDevices != null && pairedDevices.size() > 0) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject deviceObj = new JSObject();
                    deviceObj.put("name", device.getName());
                    deviceObj.put("address", device.getAddress());
                    devicesArray.put(deviceObj);
                }
            }

            JSObject ret = new JSObject();
            ret.put("devices", devicesArray);
            call.resolve(ret);
        } catch (SecurityException e) {
            call.reject("Permission denied: " + e.getMessage());
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        
        if (address == null || address.isEmpty()) {
            call.reject("Device address is required");
            return;
        }

        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        
        if (bluetoothAdapter == null) {
            call.reject("Bluetooth not supported on this device");
            return;
        }

        try {
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
            
            // Close existing connection if any
            disconnect(null);

            bluetoothSocket = device.createRfcommSocketToServiceRecord(PRINTER_UUID);
            bluetoothSocket.connect();
            outputStream = bluetoothSocket.getOutputStream();
            connectedDevice = device;

            JSObject ret = new JSObject();
            ret.put("connected", true);
            ret.put("deviceName", device.getName());
            ret.put("deviceAddress", device.getAddress());
            call.resolve(ret);
        } catch (SecurityException e) {
            call.reject("Permission denied: " + e.getMessage());
        } catch (IOException e) {
            call.reject("Failed to connect: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (bluetoothSocket != null) {
                bluetoothSocket.close();
                bluetoothSocket = null;
            }
            connectedDevice = null;

            if (call != null) {
                JSObject ret = new JSObject();
                ret.put("disconnected", true);
                call.resolve(ret);
            }
        } catch (IOException e) {
            if (call != null) {
                call.reject("Failed to disconnect: " + e.getMessage());
            }
        }
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        boolean connected = bluetoothSocket != null && bluetoothSocket.isConnected();
        
        JSObject ret = new JSObject();
        ret.put("connected", connected);
        
        if (connected && connectedDevice != null) {
            try {
                ret.put("deviceName", connectedDevice.getName());
                ret.put("deviceAddress", connectedDevice.getAddress());
            } catch (SecurityException e) {
                // Ignore permission errors for device info
            }
        }
        
        call.resolve(ret);
    }

    @PluginMethod
    public void printRaw(PluginCall call) {
        if (outputStream == null) {
            call.reject("No printer connected");
            return;
        }

        JSArray dataArray = call.getArray("data");
        
        if (dataArray == null) {
            call.reject("Print data is required");
            return;
        }

        try {
            byte[] bytes = new byte[dataArray.length()];
            for (int i = 0; i < dataArray.length(); i++) {
                bytes[i] = (byte) dataArray.getInt(i);
            }

            outputStream.write(bytes);
            outputStream.flush();

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("bytesSent", bytes.length);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to print: " + e.getMessage());
        }
    }

    @PluginMethod
    public void printText(PluginCall call) {
        if (outputStream == null) {
            call.reject("No printer connected");
            return;
        }

        String text = call.getString("text");
        
        if (text == null) {
            call.reject("Text is required");
            return;
        }

        try {
            byte[] bytes = text.getBytes("UTF-8");
            outputStream.write(bytes);
            outputStream.flush();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to print: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        disconnect(null);
    }
}
