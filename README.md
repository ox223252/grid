# Grid:

Permet de créer dynamiquement une grille qui affichera des éléments en fonction de la taille spécifié et de la taille de l’écran tout en évitant de laisser des trous.

```javascript
let config = {
	size:150,
	dataset:[
		{
			x:1,
			y:1,
			el: /* DOM élément */
		},
	]
}
```

La taille (size), permet de définir la taille minimum d'une colonne, 
- soit en px:
	```javascript
	size:150
	```
- soit en %:
	```javascript
	size:"15%",
	minSize: 150 // taille minimum de la colonne en px
	```
```javascript
let grid = new Grid ( /* DOM élément cible */, config );
```

## Options :
```javascript
let config = {
	/* ... */
	configBox:{
		id:"param",
	},
	buttons:{
		up:{
			// cssText:"",
			innerHTML:"&lt;"
		},
		down:{
			// cssText:"",
			innerHTML:"&gt;"
		}
	}
}
```		

Permet de rajouter des boutons pour changer l'ordre d'affichage des cellules, en fonction d'une `checkbox`  d'on l'id est passé par `configBox.id`. Si la `checbox` n'existe pas elle est créé.

# StackGrid :

Module avec un empilement vertical, on replis la colonne la moins haute. les éléments a traiter sont `child` du l'élément DOM cible.

```javascript
let stackGrid = new StackGrid ( /* DOM élément cible */ );
```		