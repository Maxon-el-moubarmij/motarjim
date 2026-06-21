import 'package:flutter/material.dart';

class GeneratedView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
    AppBar(
        title: Text("Title"),
      ),
    Column(
        children: [
    Container(
          padding: 0,
          margin: 0,
          textAlign: "center",
          color: "white",
          marginTop: 0,
          marginRight: 0,
          marginBottom: 0,
          marginLeft: 0,
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          boxSizing: "border-box",
          child: Column(
            children: [
    Text("Premium Wireless Headphones Experience crystal-clear audio with noise cancellation technology."),
    ElevatedButton(
            onPressed: () {},
            semanticLabel: "Shop Now",
            child: Text("Shop Now"),
          ),
            ],
          ),
        ),
        ],
      ),
    Column(
        children: [
    Card(
          child: Image.network("headphones.jpg",
          
            semanticLabel: "Wireless Headphones",),
          semanticLabel: "Wireless Headphones \$99.99 High-quality wireless audio with 30-hour battery life. Add to Cart",
        ),
        ],
      ),
    Container(
        child: Column(
          children: [
    Text("© 2026 ShopStore. All rights reserved."),
          ],
        ),
      ),
        ],
      ),
    );
  }
}
