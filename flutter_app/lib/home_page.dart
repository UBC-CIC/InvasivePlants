// ignore_for_file: library_private_types_in_public_api

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'category_info_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String selectedLocation = 'British Columbia';
  bool isBCSelected = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: const CircleAvatar(
          backgroundColor: Colors.black,
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Icon(
              Icons.location_on,
              color: Colors.black,
            ),
            const SizedBox(width: 5),
            DropdownButton<String>(
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
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: <Widget>[
            const CupertinoSearchTextField(),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: 12,
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () {
                      // Navigate to CategoryInfoPage with the selected category title
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CategoryInfoPage(
                            categoryTitle:
                                '${isBCSelected ? 'BC' : 'ONTARIO'} SPECIES ${index + 1}',
                          ),
                        ),
                      );
                    },
                    child: Container(
                      color: isBCSelected ? Colors.blue : Colors.green,
                      child: Center(
                        child: Text(
                          '${isBCSelected ? 'BC' : 'ONTARIO'} SPECIES ${index + 1}',
                          style: const TextStyle(
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
      bottomNavigationBar: const BottomAppBar(
        color: Colors.grey,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Icon(Icons.home_outlined),
            Icon(Icons.camera_alt_outlined),
            Icon(Icons.bookmark_border),
          ],
        ),
      ),
    );
  }
}
