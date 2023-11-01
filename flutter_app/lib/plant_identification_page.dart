import 'package:flutter/material.dart';

class PlantIdentificationPage extends StatelessWidget {
  final String imagePath; // Pass the image path to display
  final List<String> organs = [
    'LEAF',
    'FLOWER',
    'FRUIT',
    'BARK',
    'HABIT',
    'OTHER'
  ];

  PlantIdentificationPage({super.key, required this.imagePath});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SELECT PLANT ORGAN'),
      ),
      body: Column(
        children: <Widget>[
          Hero(
            tag: 'plantImage',
            child: Image.asset(
              imagePath, // Use the provided image path
              fit: BoxFit.cover,
              height: MediaQuery.of(context).size.height / 3,
            ),
          ),
          GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2, // 2 columns
              childAspectRatio: 1.5, // Aspect ratio of rectangles
            ),
            itemCount: organs.length,
            itemBuilder: (context, index) {
              return GestureDetector(
                onTap: () {
                  debugPrint('Selected organ: ${organs[index]}');
                },
                child: Container(
                  margin: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(organs[index]),
                  ),
                ),
              );
            },
          ),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    // Handle the 'Upload Another' action
                  },
                  child: Container(
                    color: Colors.grey,
                    height: 50,
                    child: const Center(
                      child: Text('+ Upload Another'),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    // Handle the 'Find Matches' action
                  },
                  child: Container(
                    color: Colors.grey,
                    height: 50,
                    child: const Center(
                      child: Text('Find Matches'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
