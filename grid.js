"use strict";
class Grid {
	constructor ( target, config, callback, args = {} )
	{
		this.target = target;
		this.config = config;
		this.callback = callback;
		this.args = args;

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

		while ( this.target.childNodes.length )
		{ // clean the target
			this.target.removeChild( this.target.childNodes[0] );
		}

		let nbCols = Math.floor ( ( this.target.clientWidth - 20 ) / this.config.size );
		if ( nbCols <= 0 )
		{
			nbCols = 1;
		}

		let width = ( this.target.clientWidth - 20 ) / nbCols;

		let rowId = 0;
		let rowLastId = undefined;
		let colUsed = [];
		let colPrevious = [];
		
		let table = document.createElement ( "table" );
		table.classList = "grid"
		table.style.width = "calc( 100% - 20px );"
		table.style.tableLayout = "fixed"

		let line = document.createElement( "tr" );

		let index = 0;
		while ( true )
		{
			if ( index >= this.config.dataset.length )
			{ // index out of array
				table.appendChild ( line );
				while ( colUsed[ rowId + 1 ] )
				{ // no cell remainning but need more row
					rowId++;
					table.appendChild ( document.createElement( "tr" ) );
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
				table.appendChild ( line );
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
				table.appendChild ( line );
				line = document.createElement( "tr" );
				continue;
			}

			// create new element
			let cell = this._getCell ( next );
			if ( nbCols >= cell.colSpan )
			{
				cell.style.width = ( width * cell.colSpan )+'px';
			}
			else
			{
				cell.style.width = ( width * nbCols )+'px';
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

		if ( this.config.configBox
			&& this.config.configBox.id )
		{ // create the buttons
			let style = document.createElement ( "style" );
			style.innerHTML = '#'+this.config.configBox.id+'{display:none}'
			+'#'+this.config.configBox.id+' + table td > div > button {display:none}'
			+'#'+this.config.configBox.id+':checked + table td > div > button {display:block}'

			this.target.appendChild ( style );

			let input = document.createElement ( "input" );
			input.id = this.config.configBox.id;
			input.type = 'checkbox'
			input.checked = checked;
			
			this.target.appendChild ( input );
		} 
		this.target.appendChild ( table );

		if ( this.callback )
		{
			this.callback ( event, this.args )
		}
	}

	_getCell ( index )
	{
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
		div.style.alignItems = 'center';
		div.style.justifyContent = "space-between";

		this.config.dataset[ index ].cell.appendChild ( div )

		if ( this.config.buttons
			&& this.config.buttons.up
			&& this.config.buttons.up.innerHTML )
		{
			let bUp = document.createElement ( "button" )
			bUp.innerHTML = this.config.buttons.up.innerHTML;
			bUp.style.cssText = this.config.buttons.up.cssText;
			bUp.addEventListener ( "click", (e)=>{this._change(e,"up")});
			div.appendChild ( bUp )
		}

		if ( this.config.dataset[ index ].el )
		{
			this.config.dataset[ index ].el.style.flexGrow = 1;
			this.config.dataset[ index ].el.style.height = '100%';
			this.config.dataset[ index ].el.style.overflow = 'auto';
			div.appendChild ( this.config.dataset[ index ].el );
		}

		if ( this.config.buttons
			&& this.config.buttons.down
			&& this.config.buttons.down.innerHTML )
		{
			let bDown = document.createElement ( "button" )
			bDown.innerHTML = this.config.buttons.down.innerHTML
			bDown.style.cssText = this.config.buttons.down.cssText;
			bDown.addEventListener ( "click", (e)=>{this._change(e,"down")});
			div.appendChild ( bDown )
		}

		return this.config.dataset[ index ].cell
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
			// console.log ( this.config.dataset[ index ] )
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
		}

		this.draw ( "update", true );
	}

	_getNextCell ( index, size )
	{
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
		for ( let j = 0; j < this.config.dataset[ index ].y; j++ )
		{
			if ( colUsed[ rowId + j ] == undefined )
			{
				colUsed[ rowId + j ] = [];
			}
			
			for ( let i = 0; i < this.config.dataset[ index ].x; i++ )
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