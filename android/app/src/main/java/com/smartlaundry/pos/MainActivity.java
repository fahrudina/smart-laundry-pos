package com.smartlaundry.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the ThermalPrinter plugin
        registerPlugin(ThermalPrinterPlugin.class);
    }
}
