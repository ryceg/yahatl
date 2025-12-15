import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import Constants from "expo-constants";
import {
  Info,
  ExternalLink,
  Github,
  FileText,
  Shield,
  Heart,
} from "lucide-react-native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber ?? "1";

type LinkItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  url: string;
};

function LinkItem({ icon, title, subtitle, url }: LinkItemProps) {
  const handlePress = () => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open link:", err)
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center py-3 active:opacity-70"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-secondary">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-card-foreground">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-muted-foreground">{subtitle}</Text>
        )}
      </View>
      <ExternalLink size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* App Info Header */}
      <Card className="mb-4">
        <CardContent className="items-center py-8">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Text className="text-3xl font-bold text-primary-foreground">Y</Text>
          </View>
          <Text className="mb-1 text-2xl font-bold text-foreground">YAHATL</Text>
          <Text className="mb-2 text-base text-muted-foreground">
            Yet Another Home Assistant Todo List
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-secondary px-3 py-1">
              <Text className="text-sm font-medium text-secondary-foreground">
                v{APP_VERSION}
              </Text>
            </View>
            <View className="rounded-full bg-secondary px-3 py-1">
              <Text className="text-sm font-medium text-secondary-foreground">
                Build {BUILD_NUMBER}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkItem
            icon={<Github size={20} className="text-foreground" />}
            title="Source Code"
            subtitle="View on GitHub"
            url="https://github.com/rhysgoodall/yahatl"
          />

          <View className="h-px bg-border" />

          <LinkItem
            icon={<FileText size={20} className="text-foreground" />}
            title="Documentation"
            subtitle="Setup guides & API docs"
            url="https://github.com/rhysgoodall/yahatl#readme"
          />

          <View className="h-px bg-border" />

          <LinkItem
            icon={<Shield size={20} className="text-foreground" />}
            title="Privacy Policy"
            subtitle="How we handle your data"
            url="https://github.com/rhysgoodall/yahatl/blob/main/PRIVACY.md"
          />

          <View className="h-px bg-border" />

          <LinkItem
            icon={<FileText size={20} className="text-foreground" />}
            title="Terms of Service"
            subtitle="Usage terms & conditions"
            url="https://github.com/rhysgoodall/yahatl/blob/main/TERMS.md"
          />
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Built With</CardTitle>
          <CardDescription>
            The technologies powering YAHATL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex-row flex-wrap gap-2">
            {[
              "React Native",
              "Expo",
              "TypeScript",
              ".NET 9",
              "PostgreSQL",
              "MQTT",
              "Home Assistant",
              "NativeWind",
            ].map((tech) => (
              <View
                key={tech}
                className="rounded-full bg-secondary px-3 py-1.5"
              >
                <Text className="text-sm font-medium text-secondary-foreground">
                  {tech}
                </Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Credits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center gap-2">
            <Heart size={16} className="text-destructive" />
            <Text className="text-sm text-muted-foreground">
              Made with love for the Home Assistant community
            </Text>
          </View>
          <Text className="mt-3 text-sm text-muted-foreground">
            Icons by Lucide. UI inspired by shadcn/ui.
          </Text>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

