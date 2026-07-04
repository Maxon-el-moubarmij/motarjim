import SwiftUI

struct GeneratedView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                NavbarView()

                HeroView()

                FeaturesView()
                    .padding(.vertical, 64)
                    .padding(.horizontal, 32)

                FooterView()
            }
            .frame(maxWidth: .infinity)
        }
    }
}

private struct NavbarView: View {
    var body: some View {
        HStack {
            Text("Brand")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 0.0, green: 0.439, blue: 0.953))

            Spacer()

            HStack(spacing: 24) {
                Text("Features")
                    .font(.body)
                    .foregroundColor(Color(red: 0.4, green: 0.4, blue: 0.4))
                Text("Pricing")
                    .font(.body)
                    .foregroundColor(Color(red: 0.4, green: 0.4, blue: 0.4))
                Text("About")
                    .font(.body)
                    .foregroundColor(Color(red: 0.4, green: 0.4, blue: 0.4))
                Text("Get Started")
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(red: 0.0, green: 0.439, blue: 0.953))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(8)
            }
        }
        .padding(.horizontal, 32)
        .padding(.vertical, 16)
        .background(Color.white)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

private struct HeroView: View {
    var body: some View {
        VStack(spacing: 0) {
            Text("Build Faster Native Apps")
                .font(.system(size: 48, weight: .bold))
                .foregroundColor(.white)
                .padding(.bottom, 16)

            Text("Convert your HTML designs into real native UI code automatically.")
                .font(.title3)
                .foregroundColor(.white.opacity(0.9))
                .padding(.bottom, 32)

            HStack(spacing: 16) {
                Text("Get Started")
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(red: 0.0, green: 0.439, blue: 0.953))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(8)

                Text("Learn More")
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.white, lineWidth: 2)
                    )
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 64)
        .padding(.horizontal, 32)
        .background(
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.0, green: 0.439, blue: 0.953),
                    Color(red: 0.0, green: 0.659, blue: 1.0)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}

private struct FeaturesView: View {
    var body: some View {
        LazyVGrid(
            columns: [
                GridItem(.flexible(), spacing: 32),
                GridItem(.flexible(), spacing: 32),
                GridItem(.flexible(), spacing: 32)
            ],
            spacing: 32
        ) {
            FeatureCardView(title: "Fast", description: "Sub-second compilation for most pages.")
            FeatureCardView(title: "Local-First", description: "Everything runs on your machine.")
            FeatureCardView(title: "Multi-Platform", description: "Flutter, Compose, and SwiftUI support.")
        }
        .frame(maxWidth: 1200)
        .frame(maxWidth: .infinity)
    }
}

private struct FeatureCardView: View {
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 0) {
            Text(title)
                .font(.title2)
                .bold()
                .foregroundColor(Color(red: 0.0, green: 0.439, blue: 0.953))
                .padding(.bottom, 8)

            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 6, x: 0, y: 4)
    }
}

private struct FooterView: View {
    var body: some View {
        Text("© 2024 Brand. All rights reserved.")
            .font(.body)
            .foregroundColor(Color(red: 0.4, green: 0.4, blue: 0.4))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 32)
            .background(Color(red: 0.961, green: 0.961, blue: 0.961))
    }
}
