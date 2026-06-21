import SwiftUI

struct GeneratedView: View {
    var body: some View {
    VStack {
        .navigationTitle("Title")
        VStack {
            VStack {
                Text("Premium Wireless Headphones Experience crystal-clear audio with noise cancellation technology.")
                Button("Shop Now") {
                    // action
                }
            }
        }
        VStack {
            VStack {
                Image("headphones.jpg")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .accessibilityLabel("Wireless Headphones")
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 4)
            .accessibilityLabel("Wireless Headphones $99.99 High-quality wireless audio with 30-hour battery life. Add to Cart")
        }
        VStack {
            Text("© 2026 ShopStore. All rights reserved.")
        }
    }
    }
}
