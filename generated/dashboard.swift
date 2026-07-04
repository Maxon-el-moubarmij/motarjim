import SwiftUI

struct GeneratedView: View {
    var body: some View {
        HStack(spacing: 0) {
            SidebarView()

            VStack(spacing: 0) {
                TopbarView()

                StatsView()
                    .padding(32)

                Spacer()

                FooterView()
            }
        }
        .background(Color(red: 0.941, green: 0.949, blue: 0.961))
    }
}

private struct SidebarView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            Text("MyApp")
                .font(.title2)
                .bold()
                .foregroundColor(.white)

            VStack(alignment: .leading, spacing: 16) {
                Text("Dashboard")
                    .font(.body)
                    .foregroundColor(.white)
                Text("Users")
                    .font(.body)
                    .foregroundColor(Color(red: 0.627, green: 0.627, blue: 0.722))
                Text("Settings")
                    .font(.body)
                    .foregroundColor(Color(red: 0.627, green: 0.627, blue: 0.722))
            }
        }
        .frame(width: 240, alignment: .topLeading)
        .padding(32)
        .background(Color(red: 0.102, green: 0.102, blue: 0.18))
    }
}

private struct TopbarView: View {
    var body: some View {
        HStack {
            Text("Dashboard")
                .font(.title2)
                .bold()
                .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))

            Spacer()

            Text("John Doe")
                .font(.body)
                .foregroundColor(Color(red: 0.4, green: 0.4, blue: 0.4))
        }
        .padding(.horizontal, 32)
        .padding(.vertical, 16)
        .background(Color.white)
        .shadow(color: Color.black.opacity(0.1), radius: 3, x: 0, y: 1)
    }
}

private struct StatsView: View {
    var body: some View {
        LazyVGrid(
            columns: [
                GridItem(.adaptive(minimum: 180), spacing: 24)
            ],
            spacing: 24
        ) {
            StatCardView(
                label: "Revenue",
                value: "$12,345",
                trendText: "+12%",
                trendColor: Color(red: 0.133, green: 0.773, blue: 0.369)
            )
            StatCardView(
                label: "Users",
                value: "1,234",
                trendText: "+8%",
                trendColor: Color(red: 0.133, green: 0.773, blue: 0.369)
            )
            StatCardView(
                label: "Orders",
                value: "456",
                trendText: "-3%",
                trendColor: Color(red: 0.937, green: 0.267, blue: 0.267)
            )
            StatCardView(
                label: "Traffic",
                value: "89.2k",
                trendText: "+23%",
                trendColor: Color(red: 0.133, green: 0.773, blue: 0.369)
            )
        }
    }
}

private struct StatCardView: View {
    let label: String
    let value: String
    let trendText: String
    let trendColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color(red: 0.533, green: 0.533, blue: 0.533))
                .textCase(.uppercase)
                .padding(.bottom, 8)

            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))
                .padding(.bottom, 4)

            Text(trendText)
                .font(.caption)
                .foregroundColor(trendColor)
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
    }
}

private struct FooterView: View {
    var body: some View {
        Text("© 2026 MyApp. All rights reserved.")
            .font(.caption)
            .foregroundColor(Color(red: 0.533, green: 0.533, blue: 0.533))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.white)
    }
}
