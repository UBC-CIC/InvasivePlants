import 'package:flutter/material.dart';
import 'my_plants_page.dart';
import 'camera_page.dart';
import 'plant_info_from_category_page.dart';

class CategoryInfoPage extends StatefulWidget {
  final String categoryTitle;

  const CategoryInfoPage({super.key, required this.categoryTitle});

  @override
  State<CategoryInfoPage> createState() => _CategoryInfoPageState();
}

class _CategoryInfoPageState extends State<CategoryInfoPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: Text(
          widget.categoryTitle,
          style: const TextStyle(color: Colors.black),
        ),
      ),
      body: ListView.builder(
        itemCount: 6,
        itemBuilder: (context, index) {
          return Column(
            children: <Widget>[
              const Divider(),
              GestureDetector(
                onTap: () {
                  final plantIndex = 'Plant ${index + 1}';
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          PlantInfoFromCategoryPage(plantName: plantIndex),
                    ),
                  );
                },
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: List.generate(
                            8,
                            (i) => Container(
                              margin: const EdgeInsets.fromLTRB(5, 10, 5, 10),
                              width: 88,
                              height: 88,
                              decoration: BoxDecoration(
                                color: Colors.lime,
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'Plant ${index + 1}',
                style: const TextStyle(
                  fontSize: 15,
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Colors.white,
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
        onTap: (int index) {
          if (index == 1) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const CameraPage(),
              ),
            );
          } else if (index == 2) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const MyPlantsPage(),
              ),
            );
          }
        },
      ),
    );
  }
}
