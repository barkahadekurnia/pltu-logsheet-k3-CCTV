package com.ssp.logsheet.k3;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.plugins.safearea.SafeAreaPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SafeAreaPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
