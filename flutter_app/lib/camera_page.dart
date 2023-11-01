// ignore_for_file: library_private_types_in_public_api

import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'plant_identification_page.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  _CameraPageState createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  CameraController? _controller;
  XFile? _imageFile;
  String? imagePath;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    if (cameras.isNotEmpty) {
      _controller = CameraController(cameras[0], ResolutionPreset.high);
      await _controller!.initialize();
      if (!mounted) return;
      setState(() {});
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _takePicture() async {
    if (!_controller!.value.isInitialized) {
      return;
    }

    final XFile image = await _controller!.takePicture();

    setState(() {
      _imageFile = image;
    });

    navigateToPlantIdentificationPage(image.path);
  }

  Future<void> _selectImageFromGallery() async {
    final XFile? image =
        await ImagePicker().pickImage(source: ImageSource.gallery);

    if (image != null) {
      setState(() {
        _imageFile = image;
      });

      navigateToPlantIdentificationPage(image.path);
    }
  }

  void navigateToPlantIdentificationPage(String imagePath) {
    this.imagePath = imagePath;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (context) => PlantIdentificationPage(imagePath: imagePath),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Camera'),
      ),
      body: Column(
        children: <Widget>[
          Expanded(
            child: CameraPreview(_controller!),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: <Widget>[
              IconButton(
                icon: const Icon(Icons.camera_alt),
                onPressed: _takePicture,
              ),
              IconButton(
                icon: const Icon(Icons.image),
                onPressed: _selectImageFromGallery,
              ),
            ],
          ),
          if (_imageFile != null)
            Image.file(
              File(_imageFile!.path),
              width: 300,
              height: 300,
            ),
        ],
      ),
    );
  }
}
