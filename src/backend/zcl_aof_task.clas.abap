class ZCL_AOF_TASK definition
  public
  create public .

public section.

  class-methods RUN
    importing
      !IV_WORKLIST type ZAOF_WORKLIST
      !IV_TASK type ZAOF_TASK
    returning
      value(RS_DATA) type ZAOF_RUN_DATA .
protected section.

  class-methods FILL_DATA
    importing
      !IT_RESULTS type SCIT_ALVLIST
      !IS_TASK type ZAOF_TASKS
    returning
      value(RS_DATA) type ZAOF_RUN_DATA .
  class-methods READ_SOURCE
    importing
      !IV_SOBJTYPE type SCI_TYPID
      !IV_SOBJNAME type SOBJ_NAME
    returning
      value(RT_SOURCE) type STRING_TABLE .
private section.
ENDCLASS.



CLASS ZCL_AOF_TASK IMPLEMENTATION.


  METHOD fill_data.

    FIELD-SYMBOLS: <ls_result> LIKE LINE OF it_results,
                   <ls_change> LIKE LINE OF rs_data-changes.


    rs_data-objtype = is_task-objtype.
    rs_data-objname = is_task-objname.
    rs_data-results = it_results.

    LOOP AT it_results ASSIGNING <ls_result>.
      rs_data-description = <ls_result>-description.

      READ TABLE rs_data-changes WITH KEY
        sobjtype = <ls_result>-sobjtype
        sobjname = <ls_result>-sobjname
        TRANSPORTING NO FIELDS.
      IF sy-subrc <> 0.
        APPEND INITIAL LINE TO rs_data-changes ASSIGNING <ls_change>.
        <ls_change>-sobjtype = <ls_result>-sobjtype.
        <ls_change>-sobjname = <ls_result>-sobjname.

        <ls_change>-code_before = read_source(
          iv_sobjtype = <ls_change>-sobjtype
          iv_sobjname = <ls_change>-sobjname ).

        <ls_change>-code_after = <ls_change>-code_before.
      ENDIF.
    ENDLOOP.

  ENDMETHOD.


  METHOD read_source.

    DATA: lt_source TYPE abaptxt255_tab.


    CASE iv_sobjtype.
      WHEN 'PROG'.
        CALL FUNCTION 'RPY_PROGRAM_READ'
          EXPORTING
            program_name     = iv_sobjname
            with_lowercase   = abap_true
          TABLES
            source_extended  = lt_source
          EXCEPTIONS
            cancelled        = 1
            not_found        = 2
            permission_error = 3
            OTHERS           = 4.
        ASSERT sy-subrc = 0.
      WHEN OTHERS.
        ASSERT 0 = 1.
    ENDCASE.

    rt_source = lt_source.

  ENDMETHOD.


  METHOD run.

* todo, refactor?

    DATA: lt_results TYPE scit_alvlist,
          lt_final   TYPE scit_alvlist,
          lv_class   TYPE seoclsname,
          li_fixer   TYPE REF TO zif_aof_fixer,
          ls_task    TYPE zaof_tasks.

    FIELD-SYMBOLS: <ls_result> LIKE LINE OF lt_results.


    SELECT SINGLE * FROM zaof_tasks INTO ls_task
      WHERE worklist = iv_worklist
      AND task = iv_task.
    ASSERT sy-subrc = 0.

    lt_results = zcl_aof_code_inspector=>run_object(
        iv_variant = 'ZHVAM' " todo
        iv_objtype = ls_task-objtype
        iv_objname = ls_task-objname ).

    LOOP AT lt_results ASSIGNING <ls_result> WHERE test = ls_task-test.
      lv_class = zcl_aof_fixers=>find_fixer( <ls_result> ).
      IF lv_class = ls_task-fixer.
        APPEND <ls_result> TO lt_final.
      ENDIF.
    ENDLOOP.
    CLEAR lt_results.

    rs_data = fill_data(
      is_task    = ls_task
      it_results = lt_final ).

    CREATE OBJECT li_fixer TYPE (ls_task-fixer).
    rs_data = li_fixer->run( rs_data ).

  ENDMETHOD.
ENDCLASS.
