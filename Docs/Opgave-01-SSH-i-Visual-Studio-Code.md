# Opgave 1 - Forbind SSH i Visual Studio Code

## Titel

**Opgave 1: Connect SSH i Visual Studio Code**

## Kort beskrivelse

I denne opgave skal du oprette og bruge SSH-adgang til en fjernserver fra Visual Studio Code. Du skal oprette eller bruge en SSH-nøgle, konfigurere din lokale SSH-konfiguration, installere VS Code-udvidelsen **Remote - SSH**, forbinde til serveren, åbne en fjernmappe og køre terminalkommandoer på serveren direkte fra VS Code.

Opgaven træner både praktisk serveradgang, sikker nøglebaseret login og basal fejlfinding ved SSH-problemer.

---

## Mål

Efter denne opgave skal den studerende kunne:

- Oprette og bruge SSH-nøgler.
- Konfigurere `~/.ssh/config`.
- Installere og bruge VS Code-udvidelsen **Remote - SSH**.
- Forbinde til en fjernserver via VS Code.
- Åbne en fjernmappe i VS Code.
- Køre terminalkommandoer via SSH.
- Fejlsøge almindelige SSH-problemer.

---

## Forudsætninger

Du skal have følgende klar:

- En lokal computer med Visual Studio Code installeret.
- Internetforbindelse.
- En fjernserver med SSH-adgang.
- Serverens IP-adresse eller hostname.
- Brugernavn til serveren.
- Adgang til serverens `~/.ssh/authorized_keys`, enten selv eller via serveradministrator.

Eksempel:

```text
Server IP: 203.0.113.12
Bruger: user
SSH-nøgle: ~/.ssh/id_ed25519
```

---

## Materialer og værktøjer

- Visual Studio Code, nyeste version.
- VS Code extension: **Remote - SSH** fra Microsoft.
- Terminal:
  - Bash
  - PowerShell
  - macOS Terminal
  - eller WSL på Windows
- Valgfrit: Git-klient.

---

## Opgavens resultat

Når opgaven er gennemført, skal du kunne:

1. Forbinde til serveren fra din terminal med SSH.
2. Forbinde til samme server fra Visual Studio Code med Remote - SSH.
3. Åbne en mappe på serveren i VS Code.
4. Køre kommandoer på serveren via VS Code-terminalen.
5. Dokumentere din SSH-konfiguration og dine testresultater.

---

# Del 1 - Opret eller kontroller SSH-nøgle

## 1.1 Kontroller om du allerede har en SSH-nøgle

Åbn terminalen og kør:

```bash
ls ~/.ssh
```

På Windows PowerShell kan du bruge:

```powershell
Get-ChildItem ~/.ssh
```

Kig efter filer som:

```text
id_ed25519
id_ed25519.pub
id_rsa
id_rsa.pub
```

Hvis du allerede har en nøgle, kan du bruge den. Hvis ikke, skal du oprette en ny.

## 1.2 Opret en ny SSH-nøgle

Kør:

```bash
ssh-keygen -t ed25519 -C "din-email@example.com"
```

Tryk Enter for at acceptere standardplaceringen:

```text
~/.ssh/id_ed25519
```

Du kan vælge en passphrase eller trykke Enter for ingen passphrase i testmiljøer.

## 1.3 Se din offentlige nøgle

Kør:

```bash
cat ~/.ssh/id_ed25519.pub
```

På PowerShell:

```powershell
Get-Content ~/.ssh/id_ed25519.pub
```

Kopiér hele indholdet. Det starter typisk med:

```text
ssh-ed25519 ...
```

---

# Del 2 - Tilføj SSH-nøgle til serveren

## 2.1 Tilføj public key til `authorized_keys`

På fjernserveren skal din offentlige nøgle indsættes i:

```text
~/.ssh/authorized_keys
```

Hvis du selv har adgang med password-login, kan du gøre det med:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@203.0.113.12
```

Hvis `ssh-copy-id` ikke findes, kan serveradministrator indsætte din public key manuelt.

## 2.2 Test SSH-forbindelse fra terminal

Kør:

```bash
ssh -i ~/.ssh/id_ed25519 user@203.0.113.12
```

Hvis forbindelsen virker, bør du lande i serverens terminal.

Test med:

```bash
whoami
hostname
pwd
```

Afslut SSH-sessionen med:

```bash
exit
```

---

# Del 3 - Konfigurer `~/.ssh/config`

## 3.1 Opret eller rediger SSH config

Åbn filen:

```bash
nano ~/.ssh/config
```

På Windows kan du åbne filen i VS Code:

```bash
code ~/.ssh/config
```

## 3.2 Tilføj serverkonfiguration

Indsæt følgende og tilpas værdierne:

```sshconfig
Host minserver
    HostName 203.0.113.12
    User user
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Forklaring:

| Felt | Betydning |
| --- | --- |
| `Host` | Dit lokale alias til serveren |
| `HostName` | Serverens IP-adresse eller domæne |
| `User` | Brugernavn på serveren |
| `IdentityFile` | Sti til din private SSH-nøgle |
| `IdentitiesOnly` | Tvinger SSH til at bruge den valgte nøgle |

## 3.3 Test alias

Kør:

```bash
ssh minserver
```

Hvis det virker, er din SSH config korrekt.

---

# Del 4 - Installer og brug VS Code Remote - SSH

## 4.1 Installer udvidelsen

1. Åbn Visual Studio Code.
2. Gå til **Extensions**.
3. Søg efter:

```text
Remote - SSH
```

4. Installer udvidelsen fra Microsoft.

## 4.2 Tilføj SSH-host i VS Code

1. Åbn Command Palette:

```text
Ctrl + Shift + P
```

På macOS:

```text
Cmd + Shift + P
```

2. Søg efter:

```text
Remote-SSH: Connect to Host...
```

3. Vælg enten dit host-alias:

```text
minserver
```

eller vælg:

```text
Add New SSH Host...
```

4. Indtast eksempelvis:

```bash
ssh -i ~/.ssh/id_ed25519 user@203.0.113.12
```

eller:

```bash
ssh minserver
```

5. Gem konfigurationen i:

```text
~/.ssh/config
```

## 4.3 Forbind til serveren

Brug igen:

```text
Remote-SSH: Connect to Host...
```

Vælg:

```text
minserver
```

VS Code åbner et nyt vindue og forsøger at forbinde til serveren.

Første gang installerer VS Code en serverkomponent på fjernserveren.

---

# Del 5 - Åbn fjernmappe og kør kommandoer

## 5.1 Åbn mappe på serveren

Når du er forbundet:

1. Klik **Open Folder...**.
2. Vælg en mappe på fjernserveren, fx:

```text
/home/user
```

eller:

```text
/home/user/projects
```

## 5.2 Åbn terminal i VS Code

I VS Code:

```text
Terminal -> New Terminal
```

Kør:

```bash
whoami
hostname
pwd
ls -la
```

Hvis kommandoerne køres på serveren, er Remote - SSH sat korrekt op.

---

# Del 6 - Fejlfinding

## Problem: Permission denied publickey

Mulige årsager:

- Public key er ikke indsat i serverens `authorized_keys`.
- Forkert privat nøgle bruges.
- Forkert brugernavn.
- Forkerte rettigheder på `.ssh`-mappen.

Løsning:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

På serveren:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Test med debug:

```bash
ssh -v minserver
```

## Problem: Could not resolve hostname

Mulige årsager:

- Forkert `HostName` i `~/.ssh/config`.
- Stavefejl i host-alias.
- Manglende internetforbindelse.

Kontroller:

```bash
cat ~/.ssh/config
ping 203.0.113.12
```

## Problem: VS Code forbinder ikke, men terminal SSH virker

Mulige løsninger:

- Genstart VS Code.
- Vælg korrekt SSH config-fil.
- Brug `Remote-SSH: Kill VS Code Server on Host...`.
- Prøv igen med `Remote-SSH: Connect to Host...`.

## Problem: Server kræver password hver gang

Mulige årsager:

- SSH-nøglen bruges ikke.
- Forkert `IdentityFile`.
- Public key er ikke installeret korrekt.

Test:

```bash
ssh -i ~/.ssh/id_ed25519 user@203.0.113.12
```

---

# Afleveringskrav

Den studerende skal aflevere et kort dokument eller en PDF med følgende:

1. Screenshot af installeret **Remote - SSH** extension i VS Code.
2. Screenshot af terminaltest med:

```bash
ssh minserver
whoami
hostname
pwd
```

3. Screenshot af VS Code forbundet til fjernserveren.
4. Screenshot af en fjernmappe åbnet i VS Code.
5. En anonymiseret version af `~/.ssh/config`, fx:

```sshconfig
Host minserver
    HostName 203.0.113.12
    User user
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

6. Kort refleksion:

```text
Hvilket problem oplevede du, og hvordan løste du det?
```

Vigtigt: Den private nøgle må aldrig afleveres.

---

# Vurderingskriterier

| Kriterium | Godkendt når |
| --- | --- |
| SSH-nøgle | Den studerende kan forklare public/private key |
| SSH config | Host-alias virker med `ssh minserver` |
| VS Code Remote - SSH | VS Code kan forbinde til serveren |
| Fjernmappe | En mappe på serveren kan åbnes i VS Code |
| Terminal | Kommandoer køres på fjernserveren |
| Fejlfinding | Den studerende kan bruge `ssh -v` og rette typiske fejl |

---

# Bilag A - Eksempel på `~/.ssh/config`

```sshconfig
Host minserver
    HostName 203.0.113.12
    User user
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

---

# Bilag B - Centrale kommandoer

```bash
ssh-keygen -t ed25519 -C "din-email@example.com"
cat ~/.ssh/id_ed25519.pub
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@203.0.113.12
ssh -i ~/.ssh/id_ed25519 user@203.0.113.12
ssh minserver
ssh -v minserver
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
```

---

# Bilag C - Sikkerhed

- Del aldrig din private nøgle.
- Del kun din offentlige nøgle.
- Brug helst SSH-nøgler frem for password-login.
- Brug passphrase på SSH-nøgler i rigtige miljøer.
- Brug forskellige nøgler til skole, arbejde og private projekter.
- Fjern gamle nøgler fra `authorized_keys`, når de ikke længere bruges.

---

# Bilag D - Mini-ordliste

| Begreb | Forklaring |
| --- | --- |
| SSH | Secure Shell, sikker fjernadgang til server |
| Public key | Offentlig nøgle, må deles med serveren |
| Private key | Privat nøgle, må aldrig deles |
| `authorized_keys` | Serverfil med godkendte public keys |
| `~/.ssh/config` | Lokal SSH-konfiguration |
| Host alias | Kort navn til en SSH-forbindelse |
| Remote - SSH | VS Code-udvidelse til fjernudvikling via SSH |
