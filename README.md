# Import GeoJSON de Annuaire de l’administration

## Usage

* `yarn install` pour installer les dépendances
* `yarn build` pour lancer l'import
* `yarn serve` pour lancer le serveur

## Infrastructure

Le déploiement continu est mis en place en ajoutant cette ligne au fichier `/home/cloud/.ssh/authorized_keys` :

```
command="/home/cloud/annuaire-v3/deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDnfsP02KVQNitUGdnfhl3Aeo7W0zPPk3xiF0KK08/7BdbiP4wulTu7z8aCuoYvTZYpNoNI4+vRrEWH8v73pKULFjlDiNo09HbIu9KmPqA/Wxi5nkql+z7+dhzq2ngeNbiL/Vom1Wo2AqWfsU4tMtsb2RgcGkHwV9U3xsLSOLojDPURe9pExIXWwK2tIfjaO2Efa3zsBQIu1P3v+gsyha2VGEA5s3i9bf0t//WtY7fSgwry6d2FAkO54sHmlkcF8SwZTInJcOq650OVMkibe2uOdodju6LO/NcP96E8RUgaeP12PZUTxGvPRFoObzCWW5hvz/fEpP70ultxiNsa0bYD CircleCI
```

Avec la bonne clé privée dans `~/annuaire_v3`, la nouvelle version peut être déployée avec la commande suivante :

```bash
ssh cloud@etablissements-publics.api.gouv.fr -i ~/annuaire_v3
```

Cette clé privée a été ajoutée dans CircleCI.
