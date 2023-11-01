// ignore_for_file: library_private_types_in_public_api

import 'package:flutter/material.dart';

class MyPlantsPage extends StatefulWidget {
  const MyPlantsPage({super.key});

  @override
  _MyPlantsPageState createState() => _MyPlantsPageState();
}

class _MyPlantsPageState extends State<MyPlantsPage> {
  List<String> userLists = [];

  void addNewList(String listName) {
    setState(() {
      userLists.add(listName);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MY PLANTS'),
      ),
      body: Column(
        children: <Widget>[
          Container(
            margin: const EdgeInsets.all(10),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(10),
            ),
            child: GestureDetector(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) {
                    String newListName = '';
                    return AlertDialog(
                      title: const Text('Enter your List name:'),
                      content: TextField(
                        onChanged: (text) {
                          newListName = text;
                        },
                      ),
                      actions: <Widget>[
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                          },
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () {
                            addNewList(newListName);
                            Navigator.of(context).pop();
                          },
                          child: const Text('Submit'),
                        ),
                      ],
                    );
                  },
                );
              },
              child: const Center(
                child: Text('+ new list'),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: userLists.length,
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.all(10),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(userLists[index]),
                  ),
                );
              },
            ),
          ),
        ],
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
