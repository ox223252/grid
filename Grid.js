"use strict";
class Grid {
	constructor ( params = {} )
	{
		this.target = params.target;
		this.config = params.config;
		this.callback = params.callback;

		this.draw ( "create", false );

		window.addEventListener ('resize',()=>{console.log (); this.draw()});
	}

	update ( event_id )
	{
		this.draw ( event_id, false );
	}

	draw ( event, checked = false )
	{
		if ( !this.target )
		{
			return;
		}

		// remove elements not created by Grid.js
		let numChild = 0;
		do
		{
			let c = this.target.children[ numChild ];
			if ( ( c == this.table )
				|| ( c == this.style )
				|| ( c == this.input ) )
			{
				numChild ++;
				continue;
			}

			this.target.removeChild( c );
		}
		while ( numChild < this.target.children.length );

		// add config and style div
		if ( this.config.configBox
			&& this.config.configBox.id )
		{ // create the buttons
			if ( undefined == this.style )
			{
				this.style = document.createElement ( "style" );
				this.style.innerHTML = '#'+this.config.configBox.id+'{display:none}\n'
				+'#'+this.config.configBox.id+' + table td > div > button {display:none}\n'
				+'#'+this.config.configBox.id+':checked + table td > div > button {display:block}\n'
				+'#'+this.config.configBox.id+' + table td:has(div.'+this.config.configBox.id+') {color:red}\n'
				+'#'+this.config.configBox.id+':checked + table .'+this.config.configBox.id+' {display:inherit}\n'

				this.target.appendChild ( this.style );
			}

			if ( undefined == this.input )
			{
				this.input = document.createElement ( "input" );
				this.input.id = this.config.configBox.id;
				this.input.type = 'checkbox'
				this.input.checked = checked;
				this.input.onchange = (ev)=>{
					this.paramDiv.style.display = ev.target.checked ? "" : "none";
				}
				
				this.target.appendChild ( this.input );
			}
		}

		// calc grid size
		let nbCols = Math.floor ( ( this.target.clientWidth ) / this.config.size );
		if ( nbCols <= 0 )
		{
			nbCols = 1;
		}

		let width = ( this.target.clientWidth ) / nbCols;

		let rowId = 0;
		let rowLastId = undefined;
		let colUsed = [];
		let colPrevious = [];
		
		// create grid
		if ( undefined == this.table )
		{
			this.table = document.createElement ( "table" );
			this.target.appendChild ( this.table );
		}
		else
		{
			let table = document.createElement ( "table" );
			this.table.replaceWith ( table );
			this.table = table;
		}

		this.table.classList = "grid"
		this.table.style.width = "100%"
		this.table.style.tableLayout = "fixed"

		// feed grid
		let line = document.createElement( "tr" );
		let index = 0;
		while ( true )
		{
			if ( ( this.config.editable )
				&& ( index == this.config.dataset.length ) )
			{ // if dataset is editable
			}
			else if ( index >= this.config.dataset.length )
			{ // index out of array
				this.table.appendChild ( line );
				while ( colUsed[ rowId + 1 ] )
				{ // no cell remainning but need more row
					rowId++;
					this.table.appendChild ( document.createElement( "tr" ) );
				}
				break;
			}

			if ( colPrevious.includes ( index ) )
			{ // if the current index element is already displayed
				colPrevious.splice( colPrevious.indexOf( index ), 1)
				index++;
				continue;
			}

			if ( this._isRowfull ( colUsed, rowId, nbCols ) )
			{ // if the row is full
				rowId++;
				this.table.appendChild ( line );
				line = document.createElement( "tr" );
			}

			// get the size of the next empty cell
			let nextEmpty = this._getNextEmptycell ( colUsed, rowId, nbCols );

			// search the next element to be displayed
			let next = index;
			if ( nextEmpty.size == nbCols )
			{ // if the row is empty, the next element is the current
			}
			else do 
			{ // else search an element with the good size
				next = this._getNextCell ( next, nextEmpty.size );

				if ( colPrevious.includes ( next ) )
				{
					next++;
				}
				else
				{
					break;
				}
			} 
			while ( true );

			if ( next == -1 )
			{ // all remainning elements are larger than the remainning
				// space in the line
				rowId++;
				this.table.appendChild ( line );
				line = document.createElement( "tr" );
				continue;
			}

			// create new element
			let cell = this._getCell ( next );
			if ( nbCols >= cell.colSpan )
			{
				cell.style.width = ( cell.colSpan / nbCols * 100 )+'%';
			}
			else
			{
				cell.style.width = '100%';
			}

			if ( cell.colSpan > nbCols )
			{
				cell.colSpan = nbCols;
			}
			line.appendChild ( cell );
			
			// update lines size
			this._updateColUsed ( next, colUsed, nextEmpty.index, rowId, nbCols );
			
			if ( next != index )
			{ // save the element
				colPrevious.push( next );
			}
			else
			{
				index++;
			}
		}

		if ( ( this.callback )
			&& ( this.callback.draw ) )
		{
			this.callback.draw ( event )
		}
	}

	_getCell ( index )
	{
		if ( index == this.config.dataset.length )
		{
			return this._getParamCell ( this.config.dataset.length );
		}

		this.config.dataset[ index ].cell = document.createElement ( "td" );
		this.config.dataset[ index ].cell.id = "cel_"+index
		this.config.dataset[ index ].cell.classList = "gridCell"
		this.config.dataset[ index ].cell.style.height = '100%';
		this.config.dataset[ index ].cell.colSpan = this.config.dataset[ index ].x
		this.config.dataset[ index ].cell.rowSpan = this.config.dataset[ index ].y

		let div = document.createElement ( "div" );
		div.style.height = '100%';
		div.style.width = '100%';
		div.style.display = 'flex';
		div.style.position = "relative";
		div.style.alignItems = 'center';
		div.style.justifyContent = "space-between";

		this.config.dataset[ index ].cell.appendChild ( div );

		if ( this.config.dataset[ index ].el )
		{
			this.config.dataset[ index ].el.style.flexGrow = 1;
			this.config.dataset[ index ].el.style.height = '100%';
			this.config.dataset[ index ].el.style.overflow = 'auto';
			div.appendChild ( this.config.dataset[ index ].el );
		}

		if ( !this.config.buttons )
		{

		}
		else for ( let item of [ "up", "down", "remove", "update" ] )
		{
			if ( !this.config.buttons[ item ] )
			{
				continue;
			}

			let button = document.createElement ( "button" );
			div.appendChild ( button );
			button.style.cssText = this.config.buttons[ item ].cssText || "";
			button.innerHTML = this.config.buttons[ item ].innerHTML || "";
			button.style.position ||= "absolute";
			button.style.fontSize ||= "1em";

			button.title = index;
			button.addEventListener ( "click", (e)=>{
				this._change(e,item);

				if ( ( this.callback )
					&& ( this.callback[ item ] ) )
				{
					this.callback[ item ] ( e, index );
				}
			});

			switch ( item )
			{
				case "up":
				{
					button.innerHTML ||= "&#x21E6";
					button.style.left ||= 0;
					break;
				}
				case "down":
				{
					button.innerHTML ||= "&#x21E8";
					button.style.right ||= 0;
					break;
				}
				case "remove":
				{
					button.innerHTML ||= "&#x274C;";
					button.style.fontWeight ||= "bold";
					button.style.top ||= 0;
					button.style.right ||= 0;
					button.style.height ||= "1.3em";
					break;	
				}
				case "update":
				{
					button.innerHTML ||= "&#8635;";
					button.style.fontWeight ||= "bold";
					button.style.top ||= 0;
					button.style.right ||= "1.4em";
					button.style.height ||= "1.3em";
					break;
				}
			}
		}

		return this.config.dataset[ index ].cell
	}

	_getParamCell ( index )
	{
		this.paramDiv = document.createElement ( "td" );
		this.paramDiv.id = "cel_"+index
		this.paramDiv.classList = "gridCell"
		this.paramDiv.style.height = '100%';
		this.paramDiv.style.display = ( this.input && this.input.checked )?"":"none";
		this.paramDiv.colSpan = 1;
		this.paramDiv.rowSpan = 1;

		let div = document.createElement ( "div" );
		div.className = this.config.configBox.id;
		div.style.height = '100%';
		div.style.width = '100%';
		div.style.display = 'flex';
		div.style.position = "relative";
		div.style.alignItems = 'center';
		div.style.justifyContent = "space-between";
		div.style.cursor = "pointer";
		div.style.fontSize = "3em";
		div.style.justifyContent = "center";
		div.appendChild ( document.createTextNode ( '+' ) );

		if ( ( this.callback )
			&& ( this.callback.add ) )
		{
			div.onclick = this.callback.add;
		}

		this.paramDiv.appendChild ( div );
		
		return this.paramDiv;
	}

	_change ( e, mode )
	{
		let el = e.target;
		while ( !el.id )
		{
			if ( el.nodeName == "BODY" )
			{
				return;
			}
			el = el.parentNode;
		}
		let ori = el.id;

		let index = 0;
		while ( index < this.config.dataset.length )
		{
			if ( this.config.dataset[ index ].cell.id == ori )
			{
				break;
			}
			index++;
		}

		switch ( mode )
		{
			case "up":
			{
				if ( index <= 0 )
				{
					return;
				}
				this.config.dataset.splice ( index-1, 0, this.config.dataset.splice ( index, 1 )[0] );
				break;
			}
			case "down":
			{
				if ( index >= this.config.dataset.length )
				{
					return;
				}
				this.config.dataset.splice ( index+1, 0, this.config.dataset.splice ( index, 1 )[0] );
				break;
			}
			case "remove":
			{
				if ( index >= this.config.dataset.length )
				{
					return;
				}
				this.config.dataset.splice ( index, 1 );
				break;
			}
		}

		this.draw ( "update", true );
	}

	_getNextCell ( index, size )
	{
		if ( index == this.config.dataset.length )
		{
			return this.config.dataset.length;
		}
		while ( index < this.config.dataset.length )
		{
			if ( this.config.dataset[ index ].x <= size )
			{
				return index
			}
			index++;
		}
		return -1;
	}

	_updateColUsed ( index, colUsed, colId, rowId, nbCols )
	{
		let horizontal = undefined;
		if ( this.config.dataset[ index ] )
		{
			horizontal = this.config.dataset[ index ].x;
		}
		else
		{
			horizontal = this.paramDiv.colSpan;
		}

		let vertical = undefined;
		if ( this.config.dataset[ index ] )
		{
			vertical = this.config.dataset[ index ].y;
		}
		else
		{
			vertical = this.paramDiv.rowSpan;
		}

		for ( let j = 0; j < vertical; j++ )
		{
			if ( colUsed[ rowId + j ] == undefined )
			{
				colUsed[ rowId + j ] = [];
			}
			
			for ( let i = 0; i < horizontal; i++ )
			{
				colUsed[ rowId + j ][ colId + i] = index;
			}
		}
	}

	_isRowfull (  colUsed, rowId, nbCols )
	{
		if ( !colUsed[ rowId ]
			|| colUsed[ rowId ].length < nbCols )
		{
			return false;
		}
		else for ( let i = 0; i < nbCols; i++ )
		{
			if ( isNaN( colUsed[ rowId ][ i ] ) )
			{
				console.log( nbCols +" : "+ i )
				return false;
			}
		}
		return true;
	}

	_getNextEmptycell ( colUsed, rowId, nbCols )
	{
		if ( !colUsed[ rowId ] )
		{
			return { index:0, size:nbCols };
		}

		let size = 0;
		let i = 0;
		let index = undefined;
		while ( i < nbCols )
		{
			if ( !isNaN( colUsed[ rowId ][ i ] ) && size )
			{
				break;
			}
			if ( isNaN( colUsed[ rowId ][ i ] ) )
			{
				if ( index == undefined )
				{
					index = i;
				}
				size++;
			}
			i++;
		}
		// console.log( colUsed[ rowId ] )
		return { index:index, size:size };
	}
}