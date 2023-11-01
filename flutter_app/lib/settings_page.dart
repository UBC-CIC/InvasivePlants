import 'package:flutter/material.dart';
import 'package:toggle_switch/toggle_switch.dart'; // Import the toggle_switch package

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: const Text('SETTINGS'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: <Widget>[
            const CircleAvatar(
              backgroundColor: Colors.black, // Change to your color
            ),
            const SizedBox(height: 10),
            const Column(
              children: <Widget>[
                Text(
                  'First Last',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text('emailuser@gmail.com'),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.grey,
              ),
              child: const Center(
                child: Text('+ add account'),
              ),
            ),
            const SizedBox(height: 20),
            const Divider(
              color: Colors.grey,
            ),
            const SizedBox(height: 5),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                const Icon(Icons.translate),
                ToggleSwitch(
                  minWidth: 40,
                  cornerRadius: 20,
                  activeBgColor: const [Colors.green],
                  activeFgColor: Colors.green,
                  inactiveBgColor: Colors.grey[300],
                  inactiveFgColor: Colors.grey[600],
                  initialLabelIndex: 0,
                  labels: const ['English', 'French'],
                  onToggle: (index) {
                    // Handle language switch
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
