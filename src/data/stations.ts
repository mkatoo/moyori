export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const stations: Station[] = [
  // 東京都内主要駅
  { id: "tokyo", name: "東京", lat: 35.6812, lng: 139.7671 },
  { id: "shinjuku", name: "新宿", lat: 35.6896, lng: 139.7006 },
  { id: "shibuya", name: "渋谷", lat: 35.6580, lng: 139.7016 },
  { id: "ikebukuro", name: "池袋", lat: 35.7295, lng: 139.7109 },
  { id: "shinagawa", name: "品川", lat: 35.6284, lng: 139.7387 },
  
  // 神奈川県主要駅
  { id: "yokohama", name: "横浜", lat: 35.4657, lng: 139.6220 },
  { id: "kawasaki", name: "川崎", lat: 35.5308, lng: 139.6970 },
  { id: "fujisawa", name: "藤沢", lat: 35.3405, lng: 139.4893 },
  
  // 埼玉県主要駅
  { id: "omiya", name: "大宮", lat: 35.9067, lng: 139.6235 },
  { id: "urawa", name: "浦和", lat: 35.8617, lng: 139.6449 },
  
  // 千葉県主要駅
  { id: "chiba", name: "千葉", lat: 35.6074, lng: 140.1065 },
  { id: "funabashi", name: "船橋", lat: 35.6955, lng: 139.9846 },
  
  // 大阪府主要駅
  { id: "osaka", name: "大阪", lat: 34.7024, lng: 135.4959 },
  { id: "namba", name: "難波", lat: 34.6658, lng: 135.5007 },
  { id: "tennoji", name: "天王寺", lat: 34.6452, lng: 135.5066 },
  
  // 兵庫県主要駅
  { id: "kobe", name: "神戸", lat: 34.6726, lng: 135.1830 },
  { id: "nishinomiya", name: "西宮", lat: 34.7406, lng: 135.3417 },
  
  // 京都府主要駅
  { id: "kyoto", name: "京都", lat: 34.9859, lng: 135.7581 },
  
  // 愛知県主要駅
  { id: "nagoya", name: "名古屋", lat: 35.1709, lng: 136.8815 },
  
  // 福岡県主要駅
  { id: "hakata", name: "博多", lat: 33.5904, lng: 130.4217 },
];