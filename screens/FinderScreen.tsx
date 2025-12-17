import { useState } from "react";
import { View, Text, Button, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { rawgGet } from "../api/rawg";
import { RawgGame, RawgListResponse } from "../models/rawg";

type Props = NativeStackScreenProps<RootStackParamList, "Finder">;

// kovakoodattuja genrejä
const GENRES = [
  { label: "Action", value: "action" },
  { label: "Adventure", value: "adventure" },
  { label: "RPG", value: "role-playing-games-rpg" },
  { label: "Shooter", value: "shooter" },
  { label: "Strategy", value: "strategy" },
  { label: "Indie", value: "indie" },
  { label: "Simulation", value: "simulation" },
  { label: "Puzzle", value: "puzzle" },
  { label: "Sports", value: "sports" },
];

// kovakoodattuja alustoja
const PLATFORMS = [
  { label: "PC", value: "4" },
  { label: "PlayStation 5", value: "187" },
  { label: "PlayStation 4", value: "18" },
  { label: "Xbox Series X|S", value: "186" },
  { label: "Xbox One", value: "1" },
  { label: "Nintendo Switch", value: "7" },
  { label: "iOS", value: "3" },
  { label: "Android", value: "21" },
];

//Arpoo n kappaletta uniikkeja pelejä
function pickRandomDistinct(games: RawgGame[], n: number): RawgGame[] {
  const unique = new Map<number, RawgGame>();
  for (const g of games) unique.set(g.id, g);
  const arr = Array.from(unique.values());
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

export default function FinderScreen({ navigation }: Props) {
  const [genre, setGenre] = useState<string>(GENRES[0].value);
  const [platform, setPlatform] = useState<string>(PLATFORMS[0].value);
  const [minMeta, setMinMeta] = useState<number>(70);

  const [recommendations, setRecommendations] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------hakee ja arpoo 3 peliä RAWG apista---------------
  async function fetchRandom3() {
    try {
      setLoading(true);
      setError(null);
      setRecommendations([]);

      const baseQuery = {
        genres: genre,
        platforms: platform,
        metacritic: `${minMeta},100`,
      } as const;

      //kuinka moni peli täyttää kriteerit
      const countResp = await rawgGet<RawgListResponse<RawgGame>>("/games", {
        ...baseQuery,
        page_size: 1,
        page: 1,
      });

      const total = countResp.count;
      if (!total || total <= 0) {
        setError("No games found with these filters.");
        return;
      }

      // Arpoo sivuja ja kerää kriteerit täyttäviä pelejä
      // jokaisella sivulla on 40 peliä
      // pelit on RAWGissa listattu suosion ja relevanssin perusteella
      const PAGE_SIZE = 40;
      const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

      const bucket: RawgGame[] = [];
      const triedPages = new Set<number>();

      // Hakee useamman satunnaisen sivun
      // lisää kaikki arvotulla sivulla olevat pelit bucketiin
      // yrittää max 6 API-kutsua, mutta lopettaa jo aiemmin, jos bucketissa 120 peliä
      // käytännössä lisätään pelit kolmelta eri sivulta
      // arvottujen pelien vaihtelevuutta voisi lisätä nostamalla bucketin kokoa esim 200, mutta tällöin joutuisi käyttämään enemmän API-kutsuja
      // RAWG API ei tue satunnaishakua, jonka vuoksi satunnaishaku tässä koodissa on toteutettu näin
      for (let attempt = 0; attempt < 6 && bucket.length < 120; attempt++) {
        const page = 1 + Math.floor(Math.random() * maxPage);
        if (triedPages.has(page)) continue;
        triedPages.add(page);

        const pageResp = await rawgGet<RawgListResponse<RawgGame>>("/games", {
          ...baseQuery,
          page_size: PAGE_SIZE,
          page,
        });

        bucket.push(...pageResp.results);
      }

      // Arpoo 3 uniikkia peliä bucketista
      const picked = pickRandomDistinct(bucket, 3);

      if (picked.length === 0) {
        setError("No games found (try different filters).");
        return;
      }

      setRecommendations(picked);
    } catch {
      setError("Failed to fetch games. Check API key / network.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>

      {/* genre */}
      <Text style={styles.label}>Genre</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={genre} onValueChange={(v) => setGenre(String(v))}>
          {GENRES.map((g) => (
            <Picker.Item key={g.value} label={g.label} value={g.value} />
          ))}
        </Picker>
      </View>

      {/*alusta*/}
      <Text style={styles.label}>Platform</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={platform} onValueChange={(v) => setPlatform(String(v))}>
          {PLATFORMS.map((p) => (
            <Picker.Item key={p.value} label={p.label} value={p.value} />
          ))}
        </Picker>
      </View>

      {/*min metacritic*/}
      <Text style={styles.label}>Min Metacritic</Text>
      <View style={styles.row}>
        <Button title="-" onPress={() => setMinMeta((m) => Math.max(0, m - 5))} />
        <Text style={styles.meta}>{minMeta}</Text>
        <Button title="+" onPress={() => setMinMeta((m) => Math.min(100, m + 5))} />
      </View>

      <View style={{ height: 10 }} />

      {/*hae suositukset*/}
      <Button title="Get 3 random games" onPress={fetchRandom3} />

      {/*latausruutu,error*/}
      {loading && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {/*suositukset*/}
      {recommendations.length > 0 && (
        <View style={styles.recoBox}>
          <Text style={styles.recoTitle}>Your picks</Text>
          {recommendations.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => navigation.navigate("Details", { gameId: g.id, title: g.name })}
              style={styles.recoItem}
            >
              <Text style={styles.recoName}>
                {g.name} ({g.metacritic ?? "N/A"})
              </Text>
              {g.released ? <Text style={styles.recoSub}>Released: {g.released}</Text> : null}
            </Pressable>
          ))}

          <View style={{ height: 8 }} />
          <Button title="Reroll (same filters)" onPress={fetchRandom3} />
        </View>
      )}

      {/*"footer"*/}
      <Text style={styles.footer}>Data provided by RAWG</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: "600" },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  meta: { minWidth: 40, textAlign: "center", fontSize: 16 },
  error: { color: "red", marginTop: 8 },
  recoBox: { marginTop: 14, padding: 12, backgroundColor: "#eee", borderRadius: 10 },
  recoTitle: { fontWeight: "bold", marginBottom: 8, fontSize: 16 },
  recoItem: { paddingVertical: 8 },
  recoName: { fontSize: 15, fontWeight: "600" },
  recoSub: { opacity: 0.7 },
  footer: { textAlign: "center", opacity: 0.6, marginTop: 10 },
});