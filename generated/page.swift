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
                    .frame(maxWidth: 1200)

                ContactFormView()
                    .frame(maxWidth: 600)
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
            Text("My App")
                .font(.title)
                .bold()
                .foregroundColor(.white)

            Spacer()

            HStack(spacing: 32) {
                Text("Home")
                    .font(.body)
                    .foregroundColor(.white)
                Text("About")
                    .font(.body)
                    .foregroundColor(.white)
                Text("Contact")
                    .font(.body)
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .frame(maxWidth: 1200)
        .frame(maxWidth: .infinity)
        .background(Color(red: 0.102, green: 0.102, blue: 0.18))
    }
}

private struct HeroView: View {
    var body: some View {
        VStack(spacing: 0) {
            Text("Welcome to My App")
                .font(.largeTitle)
                .bold()
                .foregroundColor(.white)
                .padding(.bottom, 16)

            Text("A modern application built with the best technologies.")
                .font(.title3)
                .foregroundColor(.white.opacity(0.9))
                .padding(.bottom, 32)

            Button(action: {}) {
                Text("Get Started")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(Color(red: 0.914, green: 0.271, blue: 0.377))
                    .cornerRadius(8)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 96)
        .background(
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.102, green: 0.102, blue: 0.18),
                    Color(red: 0.086, green: 0.129, blue: 0.243)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}

private struct FeaturesView: View {
    var body: some View {
        HStack(spacing: 32) {
            FeatureCardView(title: "Fast", description: "Lightning fast performance")
            FeatureCardView(title: "Reliable", description: "Always available when you need it")
            FeatureCardView(title: "Secure", description: "Your data is protected")
        }
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
                .foregroundColor(.primary)
                .padding(.bottom, 8)

            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 6, x: 0, y: 4)
    }
}

private struct ContactFormView: View {
    @State private var name = ""
    @State private var email = ""
    @State private var message = ""

    var body: some View {
        VStack(spacing: 0) {
            Text("Contact Us")
                .font(.title2)
                .bold()
                .foregroundColor(.primary)
                .padding(.bottom, 16)

            VStack(spacing: 16) {
                TextField("Your Name", text: $name)
                    .font(.body)
                    .padding(12)
                    .background(Color(.systemBackground))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.867, green: 0.867, blue: 0.867), lineWidth: 1)
                    )
                    .accessibilityLabel("Your Name")

                TextField("Your Email", text: $email)
                    .font(.body)
                    .padding(12)
                    .background(Color(.systemBackground))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.867, green: 0.867, blue: 0.867), lineWidth: 1)
                    )
                    .accessibilityLabel("Your Email")

                TextEditor(text: $message)
                    .font(.body)
                    .padding(12)
                    .frame(minHeight: 150)
                    .background(Color(.systemBackground))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.867, green: 0.867, blue: 0.867), lineWidth: 1)
                    )
                    .accessibilityLabel("Your Message")

                Button(action: {}) {
                    Text("Send Message")
                        .font(.body)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color(red: 0.102, green: 0.102, blue: 0.18))
                        .cornerRadius(8)
                }
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity)
    }
}

private struct FooterView: View {
    var body: some View {
        Text("© 2026 My App. All rights reserved.")
            .font(.body)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 32)
            .background(Color(red: 0.102, green: 0.102, blue: 0.18))
    }
}
