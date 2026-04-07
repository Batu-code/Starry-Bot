const { infoEmbed } = require("../../utils/embeds");

function buildHelpEmbed() {
  return infoEmbed(
    "Yardim Menusu",
    [
      "**Guvenlik**",
      "`/guvenlik-kur`, `/guvenlik-paneli`, `/guvenli-liste`, `/kilit`, `/jail`, `/gecici-jail`, `/jail-kaldir`, `/timeout`, `/at`, `/banla`, `/uyar`, `/cezalar`, `/risk`, `/ceza-merdiveni`, `/moderator-raporu`, `/yetkili-denetim`, `/guvenlik-raporu`, `/yedek-al`, `/yedekler`, `/yedek-yukle`, `/snapshot-al`, `/snapshotlar`, `/snapshot-yukle`, `/itiraz-kanali`, `/ai-kur`",
      "",
      "**Topluluk**",
      "`/topluluk-kur`, `/ticket-paneli`, `/rol-paneli`, `/hatirlat`, `/cekilis`, `/davetler`, `/partnerlik-kur`, `/partnerlik-paneli`, `/partnerlik-istatistik`, `/partnerler`, `/partner-kara-liste`, `/partner-yenile`, `/etkinlik-olustur`, `/etkinlikler`, `/profil`, `/bio`, `/rozetler`, `/gorevler`, `/anket`, `/duyuru`, `/duyuru-planla`, `/itiraz`, `/ai-sor`, `/ayarlar`",
      "",
      "**Muzik**",
      "`/muzik-kur`, `/oynat`, `/gec`, `/duraklat`, `/devam`, `/durdur`, `/kuyruk`, `/simdicalan`, `/ses`, `/dongu`, `/muzik-filtre`, `/muzik-otomatik`, `/muzik-247`, `/playlist-kaydet`, `/playlistler`, `/playlist-oynat`, `/favori-ekle`, `/favoriler`, `/favori-oynat`",
      "",
      "**Ekonomi**",
      "`/bakiye`, `/gunluk`, `/calis`, `/market`, `/satin-al`, `/envanter`, `/yazi-tura`, `/klan-kur`, `/klan-katil`, `/para-gonder`",
    ].join("\n"),
  );
}

module.exports = {
  buildHelpEmbed,
};
