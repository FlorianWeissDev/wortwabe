/** Common German words (4+ letters, a-z only) that any adult would type. */
export const COMMON_WORDS: readonly string[] = `
tisch tische tischen tisches garten gartens  haus  hause hauses
tanne tannen ente enten katze katzen hund hunde hunden hundes baum  baumes
wasser wassers wetter wetters kinder kindern kindes kind buch buches 
schule schulen  zeit zeiten zeiten stadt   fenster fenstern
apfel apfels blume blumen blumen wiese wiesen regen regens sonne sonnen mond monde
freund freunde freunden freundes brot brote brotes woche wochen jahre jahren
regnen regnet regnete geregnet rannte rennen rennt gerannt las lesen liest gelesen
gehen geht ging gingen gegangen kommen kommt kam kamen gekommen sehen sieht sahen gesehen
machen macht machte gemacht spielen spielt spielte gespielt sagen sagt sagte gesagt
essen isst gegessen trinken trinkt trank getrunken fahren fahrt fuhr gefahren
schreiben schreibt schrieb geschrieben suchen sucht suchte gesucht warten wartet wartete
raten ratet riet geraten lachen lacht lachte gelacht wohnen wohnt wohnte gewohnt
rote roten roter rotes rotem gute guten guter gutes gutem
kleine kleinen kleiner kleines schnelle schnellen alte alten alter altes neue neuen neuer neues
  junge jungen langer lange langen kalte kalten warme warmen warmer
heute morgen gestern immer nie niemals oft selten schon noch bald dann danach hier dort
dorthin hierher vielleicht sehr ganz fast kaum gern gerne ziemlich wieder
seit oder eine einen einem einer eines dies diese diesen diesem dieser dieses
zehn zwei drei vier sechs sieben acht neun elf zwanzig hundert tausend
nach auch denn weil dass wenn aber sondern doch mich dich sich euch ihnen ihrem ihren
unser unsere euer eure mein meine meinen dein deine sein seine keine keinen keiner
mit von aus bei zum zur  unter gegen ohne durch  bis ab
jede jeden jeder jedes alle allen aller alles manche viele vielen wenige einige
wer wen wem wessen was wie wann warum wieso welche welchen welcher
werde wirst wird werden wurde wurden worden bist sind seid war waren gewesen habe hast hat haben hatte hatten
kann kannst  konnte muss musst  musste soll sollen sollte will wollen wollte darf 
`
  .split(/\s+/)
  .filter((w) => w.length >= 4 && /^[a-z]+$/.test(w));
