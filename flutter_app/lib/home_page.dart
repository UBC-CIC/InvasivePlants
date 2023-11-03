// ignore_for_file: library_private_types_in_public_api

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/settings_page.dart';
import 'category_info_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String selectedLocation = 'British Columbia';
  bool isBCSelected = true;
  String searchText = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.fromLTRB(15, 0, 0, 0),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SettingsPage(),
                ),
              );
            },
            child: Image.asset(
              'assets/images/profile.png',
              width: 24,
              height: 24,
            ),
          ),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.location_on,
              color: Colors.black,
            ),
            const SizedBox(width: 5),
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: selectedLocation,
                items:
                    <String>['British Columbia', 'Ontario'].map((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  setState(() {
                    selectedLocation = newValue ?? selectedLocation;
                    isBCSelected = newValue == 'British Columbia';
                  });
                },
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(15, 0, 15, 15),
            child: CupertinoSearchTextField(
              placeholder: 'Search',
              onChanged: (value) {
                setState(() {
                  searchText = value;
                });
              },
            ),
          ),
          Expanded(
            child: ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.all(15),
                  child: GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    childAspectRatio: 1.2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    children: _buildMatchingItems(),
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded, size: 40),
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt_outlined, size: 40),
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bookmark_border, size: 40),
            label: '',
          ),
        ],
      ),
    );
  }

  List<Widget> _buildMatchingItems() {
    List<Widget> matchingItems = [];

    for (int index = 0; index < 12; index++) {
      final speciesName =
          '${isBCSelected ? 'BC' : 'ONTARIO'} SPECIES ${index + 1}';
      if (searchText.isEmpty ||
          speciesName.toLowerCase().contains(searchText.toLowerCase())) {
        matchingItems.add(_buildGridItem(speciesName));
      }
    }

    return matchingItems;
  }

  Widget _buildGridItem(String speciesName) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CategoryInfoPage(
              categoryTitle: speciesName,
            ),
          ),
        );
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20.0),
        child: Container(
          color: isBCSelected ? Colors.blue : Colors.green,
          child: Center(
            child: Text(
              speciesName,
              style: const TextStyle(
                color: Colors.black,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
