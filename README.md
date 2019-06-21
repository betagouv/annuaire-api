# Import GeoJSON de Annuaire de l’administration

## Usage

* `npm ci` pour installer les dépendances
* `npm run build` pour lancer l'import
* `npm run serve` pour lancer le serveur

## Infrastructure

Le déploiement continu est mis en place en ajoutant cette ligne au fichier `/home/cloud/.ssh/authorized_keys` :

```
command="/home/cloud/annuaire-v3/deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDKr9S+d06PsLDiAM5tllma5JbSnXmhvcxdLoiOSVN9qFHhaqfLIDWut24FTlf+wNpEix+GE+Poaft6fPEIjuHQwtll2Ll2QhRh8zERE9bKvBv2z86uRca4ZVDQW3xPZv7kQ4sDa12tCPNYSLOi5MXhayRULY+BrIER7p7Bo1GidCLssufjk8PAPc+5PUvuUKvJAONwHfHPqgI8QJqhtk1LTh9DvMJV+Ol/FaZgnt5ZGLmsVq2kFYrWUOHF9LezisKbJAuGyWXxWFsPRoi1fMjDAcOy0BwP0OB+DJlrJCL3xibLyjODDUwYw7hBf59qaJlyMRYH86Kaxx96qkH24/St
```

Avec la bonne clé privée dans `~/annuaire_v3`, la nouvelle version peut être déployée avec la commande suivante :

```bash
ssh cloud@etablissements-publics.api.gouv.fr -i ~/annuaire_v3
```

Cette clé privée a été ajoutée dans CircleCI.
