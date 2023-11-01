import 'package:flutter/material.dart';

class CategoryInfoPage extends StatelessWidget {
  final String categoryTitle;

  const CategoryInfoPage({super.key, required this.categoryTitle});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(categoryTitle),
      ),
      body: ListView.builder(
        itemCount: 6, // Number of vertically-scrollable rows
        itemBuilder: (context, index) {
          return Column(
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: List.generate(
                          5, // Number of horizontally-scrollable squares
                          (i) => Container(
                            margin: const EdgeInsets.all(10),
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.purple,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                'Plant ${index + 1}', // Replace with dynamic plant names
                textAlign: TextAlign.left,
              ),
              const Divider(),
            ],
          );
        },
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
