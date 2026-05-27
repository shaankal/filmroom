import * as Linking from "expo-linking";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const supportEmail = "support@filmroom.app";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-5 rounded-xl border border-white/10 bg-[#1E1E1E] p-4">
      <Text className="text-xs font-bold uppercase tracking-wide text-film-gold">
        {title}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-film-chalk/75">
        {children}
      </Text>
    </View>
  );
}

export default function LegalScreen() {
  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-black text-white">Legal</Text>
        <Text className="mt-2 text-sm leading-6 text-film-chalk/65">
          Film Room is a football competition app for private leagues and
          creator communities. It is not a sportsbook, gambling product, or
          fantasy lineup manager.
        </Text>

        <Section title="Privacy">
          We collect account information, league membership, gameplay responses,
          scores, purchase status, and notification records needed to run the
          app. We do not sell personal information. Service providers such as
          Supabase, RevenueCat, Expo, OneSignal, Apple, and Google may process
          data to provide hosting, auth, purchases, notifications, and app
          distribution.
        </Section>

        <Section title="Terms">
          By using Film Room, you agree to use it for lawful entertainment and
          competition only. You may not use the app for wagering, harassment,
          abuse, scraping, cheating, or unauthorized commercial activity. League
          results are for entertainment and bragging rights unless separate
          written contest rules are provided.
        </Section>

        <Section title="Payments">
          League Pass unlocks premium league features for the stated season or
          billing period. Mobile purchases are handled by Apple App Store or
          Google Play through RevenueCat entitlement management.
        </Section>

        <Section title="Account deletion">
          You can delete your account from the Profile tab. Deletion removes
          your login, leaves active leagues, deletes notification records, and
          anonymizes profile details while retaining league integrity records.
        </Section>

        <Section title="Age">
          Film Room is not directed to children under 13. Do not use the app if
          you are under 13.
        </Section>

        <Pressable
          className="my-6 items-center rounded-xl bg-film-orange py-3 active:opacity-80"
          onPress={() => Linking.openURL(`mailto:${supportEmail}`)}>
          <Text className="font-bold text-[#0D0D0D]">Contact support</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
