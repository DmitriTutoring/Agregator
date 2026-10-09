# Agregator wiadomości

Polski agregator wiadomości skupiony na Białymstoku, Podlasiu, Polsce oraz wiadomościach międzynarodowych.

Projekt łączy wiadomości z kanałów RSS z pogodą, modułami danych rynkowych, ręcznie aktualizowanymi wynikami LOTTO oraz ręcznie aktualizowanymi średnimi cenami paliw w Polsce.

## Uruchamianie projektu

Wymagania:

- Node.js z npm
- Klucz API WeatherAPI.com
- Klucz API CoinMarketCap
- Klucz API MetalCharts

Aplikacja działa standardowo pod adresem:

http://localhost:3000


### Pierwsze uruchomienie

Należy dwukrotnie kliknąć plik start.bat.

Launcher uruchamia setup.bat. Skrypt sprawdza dostępność Node.js i npm, próbuje zainstalować Node.js LTS przez winget, instaluje zależności projektu, uruchamia serwer Node.js i otwiera stronę.

Jeżeli winget nie jest dostępny, Node.js LTS należy zainstalować ręcznie, a następnie ponownie uruchomić setup.bat.

Projekt można również uruchomić ręcznie przez cmd:

npm install
npm start


Po zmianie pliku .env należy zrestartować serwer i odświeżyć przeglądarkę.

## Konfiguracja środowiska

Prywatny plik konfiguracyjny znajduje się tutaj:

Agregator\.env


Plik powinien zawierać:

WEATHERAPI_KEY=your_weatherapi_key
COINMARKETCAP_API_KEY=your_coinmarketcap_key
METALCHARTS_API_KEY=your_metalcharts_key


Plik .env musi pozostać prywatny. Nie należy go commitować ani wklejać do rozmów.

Obecnie projekt korzysta z moich kluczy API. Pan może zastąpić ich własnymi kluczami poprzez edycję wartości w prywatnym pliku .env.

## Agregacja wiadomości

Wiadomości są pobierane przez serwer z kanałów RSS. Klucze API nie są udostępniane w przeglądarce.

Aktualna lista źródeł obejmuje:

- RMF24
- PAP MediaRoom
- Interia
- Polsat News
- Białystok.pl
- Wyborcza Białystok
- TVN24
- OKO.press
- BBC News
- The Guardian
- Nauka w Polsce
- Polskie Radio Białystok
- Gazeta.pl Wiadomości
- Onet Wiadomości
- Newsweek Polska

Filtr źródeł łączy kanały należące do tego samego wydawcy.

Serwer obsługuje kanały w kodowaniu UTF-8 oraz Windows-1250 i dekoduje numeryczne encje HTML, dzięki czemu polskie znaki są prawidłowo wyświetlane.

Funkcje modułu wiadomości:

- Panel pięciu najważniejszych historii
- Lista najnowszych wiadomości
- Do 100 najnowszych artykułów
- Filtrowanie według kategorii
- Filtrowanie według źródeł
- Zrównoważony wybór najważniejszych historii
- Automatyczne odświeżanie kanałów RSS
- Otwieranie źródeł w nowej karcie

Dostępne kategorie:

- Białystok
- Podlaskie
- Polska
- Świat
- Sport
- Technologia
- Nauka
- Kultura
- Zdrowie

## Moduł pogody

Moduł pogody korzysta z WeatherAPI.com przez serwerowy endpoint pośredniczący.

Funkcje:

- Domyślna lokalizacja: Białystok
- Lista wybranych polskich miast
- Wyszukiwanie polskich miast, miasteczek i wsi
- Aktualna pogoda
- Prognoza na trzy dni
- Zapamiętywanie lokalizacji w pamięci przeglądarki
- Odświeżanie co 30 minut
- Serwerowy cache ważny 30 minut
- Polski interfejs i komunikaty błędów
- Atrybucja WeatherAPI
- Informacja o charakterze prognozy i bezpieczeństwie

Klucz WeatherAPI pozostaje po stronie serwera.

## Moduły rynkowe

### Waluty

Moduł walut korzysta z bezpłatnego publicznego API NBP.

Wyświetlane waluty:

- EUR
- USD
- GBP
- CHF
- CZK

Kursy są średnimi kursami NBP wyświetlanymi w PLN. Serwerowy cache jest ważny 15 minut. Klucz API nie jest wymagany.

### Kryptowaluty

Moduł kryptowalut korzysta z planu Basic API firmy CoinMarketCap.

Wyświetlane aktywa:

- BTC
- ETH
- SOL
- BNB

Wartości są wyświetlane w PLN wraz ze zmianą procentową z ostatnich 24 godzin. Serwerowy cache jest ważny 15 minut. W module wyświetlana jest atrybucja CoinMarketCap.

### Metale

Moduł metali korzysta z MetalCharts.

Wyświetlane metale:

- Złoto — XAU
- Srebro — XAG
- Platyna — XPT
- Miedź — XCU

Ceny metali szlachetnych są standardowo podawane w USD za uncję trojańską. Jedna uncja trojańska ma 31,1035 grama. W module wyświetlana jest atrybucja MetalCharts.

## Ręcznie aktualizowane dane LOTTO i paliw

Moduły LOTTO i paliw nie korzystają z zewnętrznego API. Dane są przechowywane w pliku:

data/manual-info.json

Plik należy edytować ręcznie, zapisać, a następnie odświeżyć przeglądarkę.

### LOTTO

Moduł LOTTO zawiera osobne zakładki dla:

- Lotto
- Lotto Plus
- Mini Lotto
- Eurojackpot
- Multi Multi

Dane każdej gry znajdują się w tablicy lotto.games. Wybrana przy uruchomieniu zakładka jest określana przez pole lotto.activeGame.

Przykładowa struktura:

json
{
  "lotto": {
    "activeGame": "lotto",
    "games": [
      {
        "key": "lotto",
        "name": "Lotto",
        "drawDate": "2026-10-06",
        "drawNumber": "7414",
        "numbers": [8, 26, 27, 35, 42, 46],
        "sourceUrl": "https://www.lotto.pl/wyniki"
      },
      {
        "key": "eurojackpot",
        "name": "Eurojackpot",
        "drawDate": "2026-10-06",
        "drawNumber": "710",
        "numbers": [7, 12, 19, 28, 50],
        "extraNumbers": [1, 6],
        "sourceUrl": "https://www.lotto.pl/wyniki"
      },
      {
        "key": "multi-multi",
        "name": "Multi Multi",
        "drawDate": "2026-10-07",
        "drawNumber": "17071",
        "numbers": [1, 12, 15, 17, 23, 24, 27, 31, 33, 35, 37, 38, 40, 45, 46, 57, 64, 69, 72, 80],
        "plusNumber": 57,
        "sourceUrl": "https://www.lotto.pl/wyniki"
      }
    ],
    "sourceUrl": "https://www.lotto.pl/wyniki"
  },
  "fuel": {
    "asOf": "2026-10-05",
    "prices": {
      "pb95": 7.52,
      "diesel": 8.61,
      "lpg": 3.17
    },
    "unit": "PLN/l",
    "source": "Nazwa źródła",
    "sourceUrl": "https://example.com/"
  }
}

Pola LOTTO:

- activeGame: klucz zakładki wyświetlanej po załadowaniu modułu
- key: unikalny klucz gry
- name: nazwa gry wyświetlana na zakładce
- drawDate: data losowania
- drawNumber: oficjalny numer losowania
- numbers: wylosowane liczby główne
- extraNumbers: dodatkowe liczby, używane w Eurojackpot
- plusNumber: liczba Plus, używana w Multi Multi
- sourceUrl: źródło użyte do weryfikacji

Każda gra może mieć własną datę i numer losowania. Datę należy aktualizować razem z liczbami, aby było jasne, z którego losowania pochodzi wynik.

Pola paliw:

- asOf: data sprawdzenia cen
- prices.pb95: średnia cena Pb95 w PLN/l
- prices.diesel: średnia cena oleju napędowego w PLN/l
- prices.lpg: średnia cena LPG w PLN/l
- source: nazwa źródła
- sourceUrl: źródło użyte do weryfikacji

Ceny paliw powinny być opisane jako średnie i zawierać datę sprawdzenia. Wyniki LOTTO oraz ceny paliw należy ręcznie zweryfikować przed publikacją.
## Przełącznik motywu

Pasek kategorii zawiera mały przełącznik motywu korzystający z plików public/SunSymbol.svg oraz public/MoonSymbol.svg.

Wybrany motyw jest zapisywany w pamięci przeglądarki. Jeżeli użytkownik nie zapisał własnego wyboru, aplikacja korzysta z ustawień jasnego lub ciemnego motywu systemu.

Panel nagłówka z logo pozostaje ciemny w obu motywach.

## Miejsca na reklamy

Strona zawiera dwa puste miejsca na reklamy. Nie ładują one żadnego dostawcy reklam ani zewnętrznego kodu reklamowego.

Miejsca są oznaczone identyfikatorami:


ad-slot-top
ad-slot-bottom


Lokalizacje:

- ad-slot-top: górna część strony, pod paskiem wiadomości
- ad-slot-bottom: nad stopką informacyjną, wyrównane do głównej kolumny wiadomości

Pracodawca lub dostawca reklam może później zastąpić zawartość placeholdera zatwierdzonym banerem, linkiem sponsora, iframe albo kodem sieci reklamowej.

Przed dodaniem prawdziwych reklam należy sprawdzić regulamin dostawcy, wymagania dotyczące prywatności, zgody na pliki cookie oraz wymagane informacje dla użytkowników.

## Stopka

Stopka zawiera:

- Moduły projektu
- Zaufane źródła wiadomości i danych
- Kategorie wiadomości
- Placeholdery stron informacyjnych

Aktualne placeholdery ścieżek:

- /about.html
- /cooperation.html
- /contact.html
- /privacy.html
- /terms.html

Są to celowo tymczasowe ścieżki. Można je zastąpić po utworzeniu właściwych stron.

## Struktura projektu

- server.js — serwer Express, agregacja RSS, endpointy proxy API, cache i endpoint danych ręcznych
- public/index.html — struktura strony i stopka
- public/style.css — układ, responsywność, motywy, widgety, stopka i miejsca reklamowe
- public/script.js — renderowanie wiadomości, filtry, motywy, pogoda i moduły rynkowe
- public/logo-bial-pl.png — logo w nagłówku
- public/SunSymbol.svg — ikona jasnego motywu
- public/MoonSymbol.svg — ikona ciemnego motywu
- data/manual-info.json — ręcznie aktualizowane dane LOTTO i paliw
- start.bat — launcher systemu Windows
- setup.bat — sprawdzenie Node.js, instalacja zależności i uruchomienie projektu
- .env — prywatne klucze API i konfiguracja

## Przypomnienia operacyjne

- Po zmianie pliku .env należy zrestartować serwer.
- Po restarcie należy odświeżyć przeglądarkę.
- Klucze API muszą pozostać po stronie serwera.
- Plik data/manual-info.json musi zawierać poprawny JSON.
- Ręcznie wprowadzane informacje należy zweryfikować przed publikacją.
- Nie commituj pliku .env.
- Aggregator — kopia to kopia zapasowa i należy ją ignorować.