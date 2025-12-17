//Tätä voisi mahdollisesti kehittää eteenpäin, mutta mielestäni tehtävän kriteerit täyttyvät jo tällaisenaan
//Tänne voisi tulla esim datahaku ja datan esitys, kuten pelin nimi, genre, kuva, kuvaus, jne

import { View, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

export default function DetailsScreen({ route }: Props) {
  return (
    <View style={{ padding: 16 }}>
      <Text>Game ID: {route.params.gameId}</Text>
      <Text>Details view placeholder</Text>
    </View>
  );
}