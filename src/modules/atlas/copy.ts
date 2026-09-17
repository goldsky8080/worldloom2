import { useTranslation, type Language } from '../../services/localization';
const rows = `title|에르덴 변경|The Erden Marches|エルデン辺境|埃尔登边境|Biên cương Erden
subtitle|월드 아틀라스 · 샘플 대지역|WORLD ATLAS · SAMPLE REGION|ワールドアトラス · 地域見本|世界图集 · 示例大区|ATLAS THẾ GIỚI · VÙNG MẪU
preview|설계 미리보기|DESIGN PREVIEW|設計プレビュー|设计预览|THIẾT KẾ MẪU
game|플레이 지도로|Play map|プレイマップ|游戏地图|Bản đồ chơi
fit|대지역 전체|Fit region|地域全体|大区全景|Toàn vùng
far|세계 관점|Strategic view|広域表示|战略视图|Toàn cảnh
medium|영지 관점|Territory view|領地表示|领地视图|Lãnh địa
near|현장 관점|Local view|現地表示|现场视图|Địa phương
layers|지도 레이어|Map layers|地図レイヤー|地图图层|Lớp bản đồ
borders|영지 경계|Territory borders|領地境界|领地边界|Ranh giới
houses|가문 문장|House heraldry|家紋|家族纹章|Huy hiệu
settlements|정착지·성|Settlements & castles|集落・城|聚落与城堡|Dân cư & thành
resources|자원·시설|Resources & facilities|資源・施設|资源与设施|Tài nguyên
actors|인물·운송|People & transport|人物・輸送|人物与运输|Nhân vật
sites|미개발 후보지|Undeveloped sites|未開発候補地|未开发候选地|Chưa xây
territories|영지|Territories|領地|领地|Lãnh địa
houseList|가문|Houses|家門|家族|Gia tộc
objects|지도 객체|Map objects|地図オブジェクト|地图对象|Đối tượng
items|아이템 시각화|Item visuals|アイテム外観|物品外观|Vật phẩm
frontier|개척의 시작|First frontier|開拓の始まり|开拓之初|Khai phá
prosperity|성장과 번영|Growth & prosperity|成長と繁栄|发展与繁荣|Thịnh vượng
conflict|변경의 분쟁|Conflict in the marches|辺境の紛争|边境纷争|Xung đột
decline|쇠퇴와 흔적|Decline & legacy|衰退と痕跡|衰落与遗迹|Suy tàn
scenarioHint|장면을 바꿔 지도 변화를 비교하세요.|Compare how each scene changes the map.|場面ごとに地図の変化を比較。|切换场景比较地图变化。|Đổi cảnh để so sánh bản đồ.
scenarioNote|표시용 장면입니다. 게임의 소유권이나 재화를 바꾸지 않습니다.|Visual scenes only. Gameplay ownership and currency are unchanged.|表示用の場面です。ゲームの所有権や資産は変更しません。|仅为展示场景，不改变游戏所有权或资产。|Chỉ là cảnh minh họa, không đổi sở hữu hay tiền.
owner|소유자 · Ownership|Owner · Ownership|所有者|所有者|Chủ sở hữu
controller|통치자 · Control|Controller · Control|統治者|统治者|Người cai trị
operator|운영자 · Operation|Operator · Operation|運営者|运营者|Người vận hành
term|위임 통치 임기|Stewardship term|委任統治任期|委托治理期限|Nhiệm kỳ
days|일|days|日|天|ngày
unclaimed|미소유|Unclaimed|未所有|无主|Chưa có chủ
level|발전 레벨|Development level|発展レベル|发展等级|Cấp phát triển
state|상태|State|状態|状态|Trạng thái
size|영지 규모|Territory size|領地規模|领地规模|Quy mô
zone|지역 성격|Region character|地域の性格|区域性质|Loại vùng
core|왕실 안전지역|Crown safe region|王室安全地域|王室安全区|Vùng hoàng gia
wild|미개척 지역|Wild region|未開拓地域|未开拓区|Hoang dã
frontierZone|개척 지역|Frontier region|開拓地域|开拓区|Khai phá
contested|분쟁 지역|Contested region|紛争地域|争夺区|Tranh chấp
small|소영지|Small|小領地|小型领地|Nhỏ
mediumSize|중영지|Medium|中領地|中型领地|Vừa
large|대영지|Large|大領地|大型领地|Lớn
agriculture|농업|Agriculture|農業|农业|Nông nghiệp
mining|광업|Mining|鉱業|矿业|Khai khoáng
forestry|산림|Forestry|森林|林业|Lâm nghiệp
water|수자원|Water|水資源|水资源|Nguồn nước
trade|교역|Trade access|交易|贸易|Thương mại
defense|방어|Defense|防御|防御|Phòng thủ
danger|위험도|Danger|危険度|危险度|Nguy hiểm
capacity|개발 용량|Development capacity|開発容量|开发容量|Phát triển
population|인구|Population|人口|人口|Dân số
economy|경제|Economy|経済|经济|Kinh tế
infrastructure|기반시설|Infrastructure|インフラ|基础设施|Hạ tầng
security|치안|Security|治安|治安|An ninh
supply|공급|Supply|供給|供应|Tiếp tế
fortification|요새화|Fortification|要塞化|要塞化|Công sự
garrisonCapacity|주둔군 수용|Garrison capacity|駐屯軍容量|驻军容量|Đồn trú
supplyCapacity|군수 보급 용량|Military supply|軍需容量|军需容量|Quân nhu
patrolRadius|순찰 범위|Patrol range|巡回範囲|巡逻范围|Tuần tra
siegeResistance|공성 저항|Siege resistance|攻城耐性|攻城抗性|Chống vây
houseLevel|가문 레벨|House level|家門レベル|家族等级|Cấp gia tộc
prestige|명성|Prestige|名声|声望|Danh vọng
influence|지역 영향력|Regional influence|地域影響力|地区影响力|Ảnh hưởng
holdings|소유 영지|Owned territories|所有領地|持有领地|Sở hữu
noLand|영지 없이 계약·교역·용병 활동으로 성장하는 가문|A house growing through contracts, trade or mercenary work without land|領地を持たず契約・交易・傭兵活動で成長する家門|无领地也可通过契约、贸易、佣兵活动成长|Gia tộc phát triển qua hợp đồng, thương mại mà không cần đất
siteHint|후보지이며 아직 건물이 없습니다. 개척과 개발 후 정착지가 생깁니다.|A reserved site, not a building. Development creates a settlement here.|候補地です。開拓後に集落が生まれます。|候选地尚无建筑，开发后形成聚落。|Địa điểm dự kiến, chưa có công trình.
focus|지도에서 보기|Locate on map|地図で見る|定位地图|Tìm trên bản đồ
choose|지도에서 영지나 거점을 선택하세요.|Select a territory or landmark on the map.|地図で領地や拠点を選択。|选择地图上的领地或据点。|Chọn lãnh địa hoặc địa danh.
drag|드래그 이동 · 휠/핀치 확대 · 방향키 · +/−|Drag to pan · Wheel/pinch to zoom · Arrows · +/−|ドラッグ移動 · ホイール/ピンチ拡大 · 矢印 · +/−|拖动平移 · 滚轮/双指缩放 · 方向键 · +/−|Kéo · Cuộn/chụm · Phím mũi tên · +/−
visualPreview|외형 비교|Visual comparison|外観比較|外观对比|Ngoại hình
reset|원래 외형|Reset appearance|外観を戻す|还原外观|Đặt lại
tier|티어 · 본체|Tier · Base|ティア · 本体|品阶 · 本体|Bậc · Hình
rarity|등급 · 프레임|Rarity · Frame|レア度 · フレーム|稀有度 · 边框|Độ hiếm · Khung
enhancement|강화 · 효과|Enhancement · Overlay|強化 · 効果|强化 · 特效|Cường hóa
itemNote|티어, 등급, 강화는 서로 독립된 시각 레이어입니다.|Tier, rarity and enhancement are independent visual layers.|ティア・レア度・強化は独立した表示レイヤー。|品阶、稀有度、强化为独立视觉图层。|Bậc, độ hiếm và cường hóa là các lớp độc lập.
loading|아틀라스 지도를 준비하는 중…|Preparing the atlas…|アトラス準備中…|正在加载图集…|Đang chuẩn bị…
error|지도를 불러오지 못했습니다.|Unable to load the map.|地図の読み込みに失敗。|地图加载失败。|Không thể tải bản đồ.
retry|다시 시도|Retry|再試行|重试|Thử lại
occupied|개발된 후보지|Developed site|開発済み候補地|已开发候选地|Đã xây
titleRank|작위|Nobility title|爵位|爵位|Tước vị
crown|왕실|Crown|王室|王室|Hoàng gia
knight|기사|Knight|騎士|骑士|Hiệp sĩ
baron|남작|Baron|男爵|男爵|Nam tước
count|백작|Count|伯爵|伯爵|Bá tước
marquess|후작|Marquess|侯爵|侯爵|Hầu tước
untitled|무작위|Untitled|無爵位|无爵位|Không tước
capital|수도|Capital|首都|首都|Thủ đô
city|도시|City|都市|城市|Thành phố
castle|성|Castle|城|城堡|Thành
town|소도시|Town|町|小城|Thị trấn
village|마을|Village|村|村庄|Làng
manor|장원|Manor|荘園|庄园|Trang viên
outpost|전초기지|Outpost|前哨基地|前哨|Tiền đồn
port|항구|Port|港|港口|Cảng
mine|광산|Mine|鉱山|矿山|Mỏ
forest|숲|Forest|森|森林|Rừng
farm|농장|Farm|農場|农场|Nông trại
dungeon|던전|Dungeon|ダンジョン|地下城|Hầm ngục
player|플레이어|Player|プレイヤー|玩家|Người chơi
npc|NPC|NPC|NPC|NPC|NPC
monster|몬스터|Monster|モンスター|怪物|Quái vật
resource|자원 노드|Resource node|資源ノード|资源点|Tài nguyên
caravan|운송 행렬|Caravan|輸送隊|商队|Vận chuyển
event|세계 이벤트|World event|世界イベント|世界事件|Sự kiện
dormant|비활성|Dormant|未活性|未激活|Chưa hoạt động
surveyed|측량 완료|Surveyed|測量済み|已测绘|Đã khảo sát
claimed|영유권 인정|Claimed|領有権認定|已确权|Đã xác lập
developing|개발 중|Developing|開発中|开发中|Phát triển
established|정착 완료|Established|定着済み|已定居|Định cư
declining|쇠퇴|Declining|衰退|衰退|Suy giảm
abandoned|황폐·폐허|Abandoned|荒廃・廃墟|荒废|Hoang phế
normal|정상|Normal|正常|正常|Bình thường
prosperous|번영|Prosperous|繁栄|繁荣|Thịnh vượng
damaged|파손|Damaged|損傷|损坏|Hư hại
burning|화재|Burning|火災|火灾|Cháy
siege|공성 중|Under siege|攻城中|围城中|Bị vây
plague|역병|Plague|疫病|瘟疫|Dịch bệnh
construction|건설 중|Under construction|建設中|建设中|Đang xây
common|일반|Common|一般|普通|Thường
uncommon|고급|Uncommon|高級|精良|Khá hiếm
rare|희귀|Rare|希少|稀有|Hiếm
epic|영웅|Epic|英雄|史诗|Sử thi
legendary|전설|Legendary|伝説|传说|Huyền thoại
pickaxe|곡괭이|Pickaxe|つるはし|镐|Cuốc
sword|검|Sword|剣|剑|Kiếm
ownershipView|소유권|Ownership|所有権|所有权|Sở hữu
controlView|통치권|Control|統治権|统治权|Cai trị
frontierStory|왕실의 안전지대 밖으로 가문이 개척을 시작합니다. 후보지는 아직 빈 땅으로 남아 있습니다.|Houses begin exploring beyond Crown lands. Reserved sites remain unbuilt.|王室の安全地帯の外で開拓開始。候補地はまだ未開発です。|家族在王室安全区外开拓，候选地尚未开发。|Gia tộc khai phá ngoài đất hoàng gia. Địa điểm dự kiến chưa xây.
prosperityStory|개척지가 활성화되고 A-15에 새벽 마을이 생깁니다. 도시와 성은 다른 모습으로 성장합니다.|Frontiers open and Dawn Village appears in A-15. Cities and castles gain new structures.|開拓地が活性化しA-15に村が誕生。都市と城の外観も成長。|开拓地激活，A-15建起新村。城市与城堡外观随之成长。|Vùng mới mở, làng Dawn xuất hiện ở A-15. Thành phố và thành đổi hình.
conflictStory|붉은가시 가문이 세 강의 도시를 통치합니다. 기존 소유권과 L4 발전도는 남고 공성 흔적이 더해집니다.|Redthorn controls Three Rivers. Ownership and L4 development remain; siege overlays appear.|レッドソーンが都市を統治。所有権とL4発展度は残り攻城表示が追加。|红棘统治三河城，所有权和L4发展度保留，并出现围城效果。|Redthorn cai trị Three Rivers. Sở hữu và L4 giữ nguyên, thêm dấu vây thành.
declineStory|안개 숲은 폐허가 되고 변경은 쇠퇴합니다. 이미 열린 영지와 가문의 역사는 지워지지 않습니다.|Mistwood lies abandoned and the marches decline. Opened territories and house histories persist.|霧の森は荒廃し辺境は衰退。開いた領地と家門の歴史は残ります。|雾林荒废，边境衰落。已开放领地和家族历史依然存在。|Mistwood hoang phế, biên cương suy tàn. Lãnh địa và lịch sử vẫn còn.`;
const langs: Language[] = ['ko', 'en', 'ja', 'zh-CN', 'vi'];
const copy = Object.fromEntries(
  langs.map((language, index) => [
    language,
    Object.fromEntries(
      rows.split('\n').map((row) => {
        const cells = row.split('|');
        return [cells[0], cells[index + 1]];
      }),
    ),
  ]),
) as Record<Language, Record<string, string>>;
export function useAtlasCopy() {
  const { language } = useTranslation();
  return {
    language,
    t: (key: string) => atlasText(key, language),
    name: (name: [string, string]) => name[language === 'ko' ? 0 : 1],
  };
}
export const atlasText = (key: string, language: Language) =>
  copy[language][key] ?? copy.en[key] ?? key;
